import { describe, expect, it, vi } from "vitest";
import {
  LedgerError,
  applyTransaction,
  canAfford,
  chargeAmount,
  computeBalance,
  idempotencyKeyFor,
} from "@/lib/credits/ledger";
import type { Db } from "@/db";

describe("ledger math", () => {
  it("balance is the sum of the ledger, in either order", () => {
    const entries = [{ amountGs: 250_000 }, { amountGs: -30_000 }, { amountGs: -20_000 }];
    expect(computeBalance(entries)).toBe(200_000);
    expect(computeBalance([...entries].reverse())).toBe(200_000);
  });

  it("an empty ledger is a zero balance", () => {
    expect(computeBalance([])).toBe(0);
  });

  it("charges are stored negative", () => {
    expect(chargeAmount(35_000)).toBe(-35_000);
  });

  it("rejects fractional and negative prices", () => {
    expect(() => chargeAmount(1_000.5)).toThrow(LedgerError);
    expect(() => chargeAmount(-1)).toThrow(LedgerError);
  });

  it("free-phase leads (price 0) always pass the affordability check", () => {
    expect(chargeAmount(0)).toBe(0);
    expect(canAfford(0, 0)).toBe(true);
    expect(canAfford(-0, 0)).toBe(true);
  });

  it("affordability is exact — spending the last guaraní is allowed", () => {
    expect(canAfford(35_000, 35_000)).toBe(true);
    expect(canAfford(34_999, 35_000)).toBe(false);
  });

  it("idempotency keys are deterministic per type and scope", () => {
    expect(idempotencyKeyFor("lead_charge", 42)).toBe("lead_charge:42");
    expect(idempotencyKeyFor("lead_charge", 42)).toBe(idempotencyKeyFor("lead_charge", 42));
    expect(idempotencyKeyFor("lead_charge", 42)).not.toBe(idempotencyKeyFor("refund", 42));
  });
});

/**
 * In-memory stand-in for the MySQL transaction used by applyTransaction.
 * No live database is available in CI (plan §5.1), so the transactional
 * behaviour is proven against a fake that records the same call sequence.
 */
function fakeDb(initialBalance: number) {
  const ledger: { id: number; idempotencyKey: string; amountGs: number }[] = [];
  const state = { balance: initialBalance, nextId: 1, locks: 0 };

  const tx = {
    select: (_fields?: unknown) => ({
      from: (_table: unknown) => {
        const rows = () => ledger;
        const builder = {
          where: (_condition: unknown) => ({
            for: (_mode: string) => {
              state.locks += 1;
              return Promise.resolve([{ id: 1, balanceGs: state.balance }]);
            },
            limit: (_n: number) =>
              Promise.resolve(
                rows()
                  .filter((r) => r.idempotencyKey === currentKey)
                  .map((r) => ({ id: r.id })),
              ),
          }),
        };
        return builder;
      },
    }),
    insert: (_table: unknown) => ({
      values: (values: { idempotencyKey: string; amountGs: number }) => {
        const row = { id: state.nextId++, ...values };
        ledger.push(row);
        return Promise.resolve({ insertId: row.id });
      },
    }),
    update: (_table: unknown) => ({
      set: (_values: unknown) => ({
        where: (_condition: unknown) => {
          state.balance += pendingDelta;
          return Promise.resolve();
        },
      }),
    }),
  };

  let currentKey = "";
  let pendingDelta = 0;

  const db = {
    transaction: async <T>(fn: (t: typeof tx) => Promise<T>): Promise<T> => fn(tx),
  } as unknown as Db;

  return {
    db,
    ledger,
    state,
    async apply(input: Parameters<typeof applyTransaction>[1]) {
      currentKey = input.idempotencyKey;
      pendingDelta = input.amountGs;
      return applyTransaction(this.db, input);
    },
  };
}

describe("applyTransaction", () => {
  it("charges once and updates the cached balance", async () => {
    const fake = fakeDb(100_000);
    const result = await fake.apply({
      professionalId: 1,
      amountGs: chargeAmount(35_000),
      type: "lead_charge",
      idempotencyKey: idempotencyKeyFor("lead_charge", 7),
      leadAssignmentId: 7,
      requireSufficientBalance: true,
    });

    expect(result.applied).toBe(true);
    expect(result.balanceGs).toBe(65_000);
    expect(fake.ledger).toHaveLength(1);
    expect(fake.state.balance).toBe(65_000);
  });

  it("a replayed accept is a no-op, not a second charge", async () => {
    const fake = fakeDb(100_000);
    const input = {
      professionalId: 1,
      amountGs: chargeAmount(35_000),
      type: "lead_charge" as const,
      idempotencyKey: idempotencyKeyFor("lead_charge", 7),
      leadAssignmentId: 7,
      requireSufficientBalance: true,
    };

    await fake.apply(input);
    const replay = await fake.apply(input);

    expect(replay.applied).toBe(false);
    expect(fake.ledger).toHaveLength(1);
    expect(fake.state.balance).toBe(65_000);
  });

  it("locks the professional row before reading the balance", async () => {
    const fake = fakeDb(50_000);
    await fake.apply({
      professionalId: 1,
      amountGs: chargeAmount(10_000),
      type: "lead_charge",
      idempotencyKey: idempotencyKeyFor("lead_charge", 1),
      requireSufficientBalance: true,
    });
    expect(fake.state.locks).toBe(1);
  });

  it("blocks a charge that would overdraw the balance", async () => {
    const fake = fakeDb(10_000);
    await expect(
      fake.apply({
        professionalId: 1,
        amountGs: chargeAmount(35_000),
        type: "lead_charge",
        idempotencyKey: idempotencyKeyFor("lead_charge", 9),
        requireSufficientBalance: true,
      }),
    ).rejects.toMatchObject({ code: "insufficient_balance" });
    expect(fake.ledger).toHaveLength(0);
  });

  it("free-phase charges pass on a zero balance", async () => {
    const fake = fakeDb(0);
    const result = await fake.apply({
      professionalId: 1,
      amountGs: chargeAmount(0),
      type: "lead_charge",
      idempotencyKey: idempotencyKeyFor("lead_charge", 11),
      requireSufficientBalance: true,
    });
    expect(result.applied).toBe(true);
    expect(result.balanceGs).toBe(0);
  });

  it("rejects fractional guaraní before touching the database", async () => {
    const fake = fakeDb(100_000);
    const spy = vi.spyOn(fake.db, "transaction");
    await expect(
      fake.apply({
        professionalId: 1,
        amountGs: -0.5,
        type: "adjustment",
        idempotencyKey: "adjustment:x",
      }),
    ).rejects.toThrow(LedgerError);
    expect(spy).not.toHaveBeenCalled();
  });
});

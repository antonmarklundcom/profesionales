/**
 * Credit ledger — the single owner of ALL balance math (plan §5.2).
 *
 * Rules that must never be relaxed:
 *  - `credit_transactions` is the authority; `professionals.credit_balance_gs`
 *    is a cache updated inside the same DB transaction as the ledger row.
 *  - Every write carries an `idempotency_key`; replays are no-ops, not duplicates.
 *  - Lead charges are stored negative; purchases/bonuses positive.
 *  - Guaraní amounts are whole numbers. No floats, ever.
 *
 * The pure functions here are unit-tested without a database; the DB-bound
 * `applyTransaction` uses them so the same math backs both.
 */
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { creditTransactions, professionals } from "@/db/schema";
import type { TransactionType } from "@/db/schema";

export type LedgerEntry = { amountGs: number; type: TransactionType; idempotencyKey: string };

export class LedgerError extends Error {
  constructor(
    message: string,
    readonly code: "insufficient_balance" | "invalid_amount",
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

/** Balance from ledger rows. This is the definition of "balance" in this system. */
export function computeBalance(entries: Pick<LedgerEntry, "amountGs">[]): number {
  return entries.reduce((sum, e) => sum + e.amountGs, 0);
}

/** Guaraní amounts are integers; reject anything that would round. */
export function assertWholeGuarani(amountGs: number): void {
  if (!Number.isFinite(amountGs) || !Number.isInteger(amountGs)) {
    throw new LedgerError(`Amount must be a whole number of guaraníes, got ${amountGs}`, "invalid_amount");
  }
}

/** The signed ledger amount for charging a lead at `priceGs` (0 in the free phase). */
export function chargeAmount(priceGs: number): number {
  assertWholeGuarani(priceGs);
  if (priceGs < 0) throw new LedgerError("Lead price cannot be negative", "invalid_amount");
  // `0` rather than `-0`: a free-phase charge must serialize as a plain zero.
  return priceGs === 0 ? 0 : -priceGs;
}

/**
 * Can this balance absorb the charge? A price of 0 always passes, which is what
 * makes the free launch phase run through the same ledger as paid phases.
 */
export function canAfford(balanceGs: number, priceGs: number): boolean {
  return balanceGs - priceGs >= 0;
}

/** Deterministic key so a replayed accept charges once (plan §5.2). */
export function idempotencyKeyFor(type: TransactionType, scopeId: number | string): string {
  return `${type}:${scopeId}`;
}

export type ApplyInput = {
  professionalId: number;
  amountGs: number;
  type: TransactionType;
  idempotencyKey: string;
  leadAssignmentId?: number | null;
  note?: string | null;
  /** Reject the write when the resulting balance would go negative. */
  requireSufficientBalance?: boolean;
};

export type ApplyResult = { applied: boolean; balanceGs: number; transactionId: number | null };

/**
 * Write one ledger row and refresh the cached balance atomically.
 *
 * Concurrency: the professional row is locked FOR UPDATE before reading the
 * balance, so two simultaneous accepts serialize instead of both reading the
 * pre-charge balance. A replayed idempotency key returns `applied: false`.
 */
export async function applyTransaction(db: Db, input: ApplyInput): Promise<ApplyResult> {
  assertWholeGuarani(input.amountGs);

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: professionals.id, balanceGs: professionals.creditBalanceGs })
      .from(professionals)
      .where(eq(professionals.id, input.professionalId))
      .for("update");

    if (!locked) throw new LedgerError("Professional not found", "invalid_amount");

    const existing = await tx
      .select({ id: creditTransactions.id })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.professionalId, input.professionalId),
          eq(creditTransactions.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { applied: false, balanceGs: locked.balanceGs, transactionId: existing[0].id };
    }

    const nextBalance = locked.balanceGs + input.amountGs;
    if (input.requireSufficientBalance && nextBalance < 0) {
      throw new LedgerError("Saldo insuficiente para aceptar este pedido", "insufficient_balance");
    }

    const inserted = await tx.insert(creditTransactions).values({
      professionalId: input.professionalId,
      amountGs: input.amountGs,
      type: input.type,
      leadAssignmentId: input.leadAssignmentId ?? null,
      idempotencyKey: input.idempotencyKey,
      note: input.note ?? null,
    });

    await tx
      .update(professionals)
      .set({ creditBalanceGs: sql`${professionals.creditBalanceGs} + ${input.amountGs}` })
      .where(eq(professionals.id, input.professionalId));

    const transactionId = Number((inserted as unknown as { insertId?: number }).insertId ?? 0) || null;
    return { applied: true, balanceGs: nextBalance, transactionId };
  });
}

/** Recompute the cached balance from the ledger — the cache is never the truth. */
export async function recomputeBalance(db: Db, professionalId: number): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${creditTransactions.amountGs}), 0)` })
    .from(creditTransactions)
    .where(eq(creditTransactions.professionalId, professionalId));

  const total = Number(row?.total ?? 0);
  await db.update(professionals).set({ creditBalanceGs: total }).where(eq(professionals.id, professionalId));
  return total;
}

/**
 * COMPLETE schema for profesionales.com.py (plan.md §2).
 *
 * Every table the whole build needs is defined here in phase opus-1, including
 * tables only later phases read or write. Per plan §2 later phases add NO tables
 * and NO columns — a needed change is a stop-and-ask (§4.4).
 *
 * Money is always stored in guaraníes (Gs) as integers. Guaraní has no decimal
 * subunit, so there are no cents anywhere in this schema.
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/* -------------------------------------------------------------------------- */
/* Shared column helpers                                                       */
/* -------------------------------------------------------------------------- */

const id = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();
const createdAt = () => timestamp("created_at").notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);

/* -------------------------------------------------------------------------- */
/* Enums (values are the DB truth; TS types are derived from them below)        */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ["admin", "professional"] as const;
export const USER_STATUSES = ["active", "suspended"] as const;
export const LEAD_STATUSES = ["new", "matched", "closed", "spam"] as const;
export const LEAD_SOURCES = ["web", "spoke", "ads", "admin"] as const;
export const CUSTOMER_TYPES = ["particular", "empresa"] as const;
export const ASSIGNMENT_STATUSES = ["offered", "accepted", "declined", "expired"] as const;
export const TRANSACTION_TYPES = ["purchase", "lead_charge", "refund", "bonus", "adjustment"] as const;
export const REVIEW_STATUSES = ["pending", "published", "rejected"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Extra intake fields attached to a category (plan §2 `categories.form_questions`). */
export type FormQuestion = {
  key: string;
  label_es: string;
  type: "text" | "textarea" | "select" | "radio" | "number";
  required?: boolean;
  options?: { value: string; label_es: string }[];
  help_es?: string;
};

/* -------------------------------------------------------------------------- */
/* users / professionals                                                       */
/* -------------------------------------------------------------------------- */

export const users = mysqlTable(
  "users",
  {
    id: id(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", USER_ROLES).notNull().default("professional"),
    status: mysqlEnum("status", USER_STATUSES).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const professionals = mysqlTable(
  "professionals",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessName: varchar("business_name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    cedulaRuc: varchar("cedula_ruc", { length: 40 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
    bio: text("bio"),
    yearsExperience: smallint("years_experience", { unsigned: true }),
    photoUrl: varchar("photo_url", { length: 500 }),
    /** null = not verified. Only verified pros receive leads (plan §1.8). */
    verifiedAt: timestamp("verified_at"),
    /** Aggregate of published reviews, scaled x100 (450 = 4.50 stars). */
    avgRatingX100: smallint("avg_rating_x100", { unsigned: true }).notNull().default(0),
    reviewCount: int("review_count", { unsigned: true }).notNull().default(0),
    /** Cache of SUM(credit_transactions.amount_gs); the ledger is the authority. */
    creditBalanceGs: bigint("credit_balance_gs", { mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("professionals_user_uq").on(t.userId),
    uniqueIndex("professionals_slug_uq").on(t.slug),
    index("professionals_verified_idx").on(t.verifiedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* categories / zones                                                          */
/* -------------------------------------------------------------------------- */

export const categories = mysqlTable(
  "categories",
  {
    id: id(),
    slug: varchar("slug", { length: 120 }).notNull(),
    nameEs: varchar("name_es", { length: 120 }).notNull(),
    icon: varchar("icon", { length: 60 }),
    /** Price a pro is charged to accept a lead. 0 during the free phase (plan §1.3). */
    leadPriceGs: bigint("lead_price_gs", { mode: "number" }).notNull().default(0),
    maxProsPerLead: smallint("max_pros_per_lead", { unsigned: true }).notNull().default(3),
    /** FormQuestion[] — extra intake fields rendered on the lead form. */
    formQuestions: json("form_questions").$type<FormQuestion[]>().notNull().default([]),
    active: boolean("active").notNull().default(true),
    sort: smallint("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug), index("categories_active_idx").on(t.active, t.sort)],
);

export const zones = mysqlTable(
  "zones",
  {
    id: id(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    department: varchar("department", { length: 120 }).notNull(),
    active: boolean("active").notNull().default(true),
    sort: smallint("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("zones_slug_uq").on(t.slug), index("zones_active_idx").on(t.active, t.sort)],
);

export const professionalCategories = mysqlTable(
  "professional_categories",
  {
    professionalId: bigint("professional_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => professionals.id, { onDelete: "cascade" }),
    categoryId: bigint("category_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.professionalId, t.categoryId] }),
    index("professional_categories_category_idx").on(t.categoryId),
  ],
);

export const professionalZones = mysqlTable(
  "professional_zones",
  {
    professionalId: bigint("professional_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => professionals.id, { onDelete: "cascade" }),
    zoneId: bigint("zone_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.professionalId, t.zoneId] }), index("professional_zones_zone_idx").on(t.zoneId)],
);

/* -------------------------------------------------------------------------- */
/* leads / assignments                                                         */
/* -------------------------------------------------------------------------- */

export const leads = mysqlTable(
  "leads",
  {
    id: id(),
    /** Short unguessable code used in URLs and customer-facing references. */
    publicCode: varchar("public_code", { length: 32 }).notNull(),
    categoryId: bigint("category_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => categories.id),
    zoneId: bigint("zone_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => zones.id),
    description: text("description").notNull(),
    /** Answers to the category's form_questions, keyed by question key. */
    answers: json("answers").$type<Record<string, string | number | null>>().notNull().default({}),
    /** Stored file paths, max 3 (plan §1.14). Never exposed pre-accept. */
    photos: json("photos").$type<string[]>().notNull().default([]),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerWhatsapp: varchar("customer_whatsapp", { length: 20 }).notNull(),
    customerType: mysqlEnum("customer_type", CUSTOMER_TYPES).notNull().default("particular"),
    status: mysqlEnum("status", LEAD_STATUSES).notNull().default("new"),
    source: mysqlEnum("source", LEAD_SOURCES).notNull().default("web"),
    sourceDomain: varchar("source_domain", { length: 190 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("leads_public_code_uq").on(t.publicCode),
    index("leads_status_idx").on(t.status, t.createdAt),
    index("leads_category_zone_idx").on(t.categoryId, t.zoneId),
  ],
);

export const leadAssignments = mysqlTable(
  "lead_assignments",
  {
    id: id(),
    leadId: bigint("lead_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    professionalId: bigint("professional_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => professionals.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ASSIGNMENT_STATUSES).notNull().default("offered"),
    /** Unguessable token backing /lead/aceptar/[token]. */
    acceptToken: varchar("accept_token", { length: 64 }).notNull(),
    /** Snapshot of the category price at offer time — never re-read from categories. */
    priceGs: bigint("price_gs", { mode: "number" }).notNull().default(0),
    offeredAt: timestamp("offered_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("lead_assignments_lead_pro_uq").on(t.leadId, t.professionalId),
    uniqueIndex("lead_assignments_token_uq").on(t.acceptToken),
    index("lead_assignments_pro_status_idx").on(t.professionalId, t.status),
    /** Backs the fair-rotation ordering and the time-to-first-accept metric (plan §1.15). */
    index("lead_assignments_offered_idx").on(t.offeredAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* credits                                                                     */
/* -------------------------------------------------------------------------- */

export const creditTransactions = mysqlTable(
  "credit_transactions",
  {
    id: id(),
    professionalId: bigint("professional_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => professionals.id),
    /** Signed: purchases/bonuses positive, lead charges negative. */
    amountGs: bigint("amount_gs", { mode: "number" }).notNull(),
    type: mysqlEnum("type", TRANSACTION_TYPES).notNull(),
    leadAssignmentId: bigint("lead_assignment_id", { mode: "number", unsigned: true }).references(
      () => leadAssignments.id,
      { onDelete: "set null" },
    ),
    /** Makes every write replay-safe; the ledger service always supplies one. */
    idempotencyKey: varchar("idempotency_key", { length: 190 }).notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("credit_transactions_idempotency_uq").on(t.idempotencyKey),
    index("credit_transactions_pro_idx").on(t.professionalId, t.createdAt),
  ],
);

export const creditPacks = mysqlTable(
  "credit_packs",
  {
    id: id(),
    name: varchar("name", { length: 120 }).notNull(),
    priceGs: bigint("price_gs", { mode: "number" }).notNull(),
    /** Credits granted; equals price plus the pack bonus (plan §11 pricing ladder). */
    creditsGs: bigint("credits_gs", { mode: "number" }).notNull(),
    active: boolean("active").notNull().default(true),
    sort: smallint("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("credit_packs_active_idx").on(t.active, t.sort)],
);

/* -------------------------------------------------------------------------- */
/* reviews / spoke tokens / settings                                           */
/* -------------------------------------------------------------------------- */

export const reviews = mysqlTable(
  "reviews",
  {
    id: id(),
    professionalId: bigint("professional_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => professionals.id, { onDelete: "cascade" }),
    leadId: bigint("lead_id", { mode: "number", unsigned: true }).references(() => leads.id, {
      onDelete: "set null",
    }),
    rating: smallint("rating", { unsigned: true }).notNull(),
    comment: text("comment"),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    /** Single-use token behind the /opinar/[token] follow-up link. */
    requestToken: varchar("request_token", { length: 64 }).notNull(),
    status: mysqlEnum("status", REVIEW_STATUSES).notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("reviews_request_token_uq").on(t.requestToken),
    index("reviews_pro_status_idx").on(t.professionalId, t.status),
  ],
);

export const spokeTokens = mysqlTable(
  "spoke_tokens",
  {
    id: id(),
    /** SHA-256 of the bearer token; the plaintext is shown once at creation. */
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    domain: varchar("domain", { length: 190 }).notNull(),
    /** Default category for leads from this spoke; the payload may override it. */
    categoryId: bigint("category_id", { mode: "number", unsigned: true }).references(() => categories.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("spoke_tokens_hash_uq").on(t.tokenHash), index("spoke_tokens_domain_idx").on(t.domain)],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: varchar("value", { length: 1000 }).notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/* relations                                                                   */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ one }) => ({
  professional: one(professionals, { fields: [users.id], references: [professionals.userId] }),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  user: one(users, { fields: [professionals.userId], references: [users.id] }),
  categories: many(professionalCategories),
  zones: many(professionalZones),
  assignments: many(leadAssignments),
  transactions: many(creditTransactions),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  professionals: many(professionalCategories),
  leads: many(leads),
}));

export const zonesRelations = relations(zones, ({ many }) => ({
  professionals: many(professionalZones),
  leads: many(leads),
}));

export const professionalCategoriesRelations = relations(professionalCategories, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalCategories.professionalId],
    references: [professionals.id],
  }),
  category: one(categories, { fields: [professionalCategories.categoryId], references: [categories.id] }),
}));

export const professionalZonesRelations = relations(professionalZones, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalZones.professionalId],
    references: [professionals.id],
  }),
  zone: one(zones, { fields: [professionalZones.zoneId], references: [zones.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  category: one(categories, { fields: [leads.categoryId], references: [categories.id] }),
  zone: one(zones, { fields: [leads.zoneId], references: [zones.id] }),
  assignments: many(leadAssignments),
}));

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
  lead: one(leads, { fields: [leadAssignments.leadId], references: [leads.id] }),
  professional: one(professionals, {
    fields: [leadAssignments.professionalId],
    references: [professionals.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  professional: one(professionals, {
    fields: [creditTransactions.professionalId],
    references: [professionals.id],
  }),
  leadAssignment: one(leadAssignments, {
    fields: [creditTransactions.leadAssignmentId],
    references: [leadAssignments.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  professional: one(professionals, { fields: [reviews.professionalId], references: [professionals.id] }),
  lead: one(leads, { fields: [reviews.leadId], references: [leads.id] }),
}));

export const spokeTokensRelations = relations(spokeTokens, ({ one }) => ({
  category: one(categories, { fields: [spokeTokens.categoryId], references: [categories.id] }),
}));

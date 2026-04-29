import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";

/* --------------------------------------------------------------------
   Enums
   -------------------------------------------------------------------- */

export const planEnum = pgEnum("plan", [
  "free",
  "studio_monthly",
  "studio_annual",
  "lifetime",
]);

export const deviceEnum = pgEnum("device", [
  "iphone_69",
  "iphone_67",
  "ipad_13",
]);

export const ledgerReasonEnum = pgEnum("ledger_reason", [
  "purchase",
  "ai_copy",
  "ai_background",
  "ai_restyle",
  "ai_translate",
  "refund",
  "lifetime_grant",
  "monthly_reset",
]);

export const aiJobTypeEnum = pgEnum("ai_job_type", [
  "copy",
  "background",
  "restyle",
  "translate",
  "render",
]);

export const aiJobStatusEnum = pgEnum("ai_job_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

/* --------------------------------------------------------------------
   Tables
   -------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    clerkId:          text("clerk_id").notNull(),
    email:            text("email").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    plan:             planEnum("plan").notNull().default("free"),
    /** Cache only — recompute from credit_ledger inside debit transactions. */
    creditBalance:    integer("credit_balance").notNull().default(0),
    createdAt:        timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    clerkIdx:    uniqueIndex("users_clerk_id_idx").on(t.clerkId),
    stripeIdx:   uniqueIndex("users_stripe_customer_id_idx").on(t.stripeCustomerId),
    emailIdx:    index("users_email_idx").on(t.email),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    userId:         uuid("user_id").notNull(),
    name:           text("name").notNull(),
    appName:        text("app_name").notNull(),
    appDescription: text("app_description").notNull().default(""),
    category:       text("category").notNull().default(""),
    polotnoJson:    jsonb("polotno_json"),
    storeTargets:   jsonb("store_targets").$type<string[]>().notNull().default([]),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: index("projects_user_id_idx").on(t.userId),
    userFk:  foreignKey({ columns: [t.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  }),
);

export const screenshots = pgTable(
  "screenshots",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    device:    deviceEnum("device").notNull(),
    locale:    text("locale").notNull().default("en"),
    r2Key:     text("r2_key").notNull(),
    width:     integer("width").notNull(),
    height:    integer("height").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    projectIdx: index("screenshots_project_id_idx").on(t.projectId),
    projectFk:  foreignKey({ columns: [t.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
  }),
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    userId:         uuid("user_id").notNull(),
    /** Positive = credit, negative = debit, 0 = analytics-only entry for unmetered plans. */
    delta:          integer("delta").notNull(),
    reason:         ledgerReasonEnum("reason").notNull(),
    refId:          text("ref_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata:       jsonb("metadata"),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx:        index("credit_ledger_user_id_idx").on(t.userId),
    idempotencyIdx: uniqueIndex("credit_ledger_idempotency_key_idx").on(t.idempotencyKey),
    userFk:         foreignKey({ columns: [t.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  }),
);

export const aiJobs = pgTable(
  "ai_jobs",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    userId:       uuid("user_id").notNull(),
    projectId:    uuid("project_id"),
    type:         aiJobTypeEnum("type").notNull(),
    status:       aiJobStatusEnum("status").notNull().default("pending"),
    triggerRunId: text("trigger_run_id"),
    costCredits:  integer("cost_credits").notNull().default(0),
    input:        jsonb("input"),
    output:       jsonb("output"),
    error:        text("error"),
    createdAt:    timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
    updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx:    index("ai_jobs_user_id_idx").on(t.userId),
    projectIdx: index("ai_jobs_project_id_idx").on(t.projectId),
    userFk:     foreignKey({ columns: [t.userId],    foreignColumns: [users.id]    }).onDelete("cascade"),
    projectFk:  foreignKey({ columns: [t.projectId], foreignColumns: [projects.id] }).onDelete("set null"),
  }),
);

export type User          = typeof users.$inferSelect;
export type NewUser       = typeof users.$inferInsert;
export type Project       = typeof projects.$inferSelect;
export type NewProject    = typeof projects.$inferInsert;
export type Screenshot    = typeof screenshots.$inferSelect;
export type CreditLedger  = typeof creditLedger.$inferSelect;
export type AiJob         = typeof aiJobs.$inferSelect;

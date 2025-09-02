import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'state', 'district', 'block', 'mandal', 'taluk'
  parentId: integer('parent_id').references(() => regions.id),
  code: text('code').notNull().unique(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const groundwaterAssessments = sqliteTable('groundwater_assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  regionId: integer('region_id').references(() => regions.id).notNull(),
  assessmentYear: integer('assessment_year').notNull(),
  annualRecharge: real('annual_recharge').notNull(), // In MCM
  extractableResources: real('extractable_resources').notNull(), // In MCM
  totalExtraction: real('total_extraction').notNull(), // In MCM
  stageOfExtraction: text('stage_of_extraction').notNull(), // 'Safe', 'Semi-Critical', 'Critical', 'Over-Exploited'
  extractionRatio: real('extraction_ratio').notNull(), // Percentage
  trend: text('trend').notNull(), // 'Increasing', 'Stable', 'Declining'
  assessmentDate: text('assessment_date').notNull(),
  dataSource: text('data_source').notNull(), // CGWB/State GW Board
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const historicalData = sqliteTable('historical_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  regionId: integer('region_id').references(() => regions.id).notNull(),
  year: integer('year').notNull(),
  month: integer('month'),
  parameterType: text('parameter_type').notNull(), // 'recharge', 'extraction', 'water_level', 'quality'
  value: real('value').notNull(),
  unit: text('unit').notNull(), // MCM, meters, mg/L etc
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userRoles = sqliteTable('user_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(), // Auth user reference
  role: text('role').notNull(), // 'Public', 'Researcher', 'Policymaker', 'Admin'
  permissions: text('permissions', { mode: 'json' }).notNull(), // Access permissions
  organization: text('organization'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});
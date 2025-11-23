// apps/backend/src/db/schema/auth.ts
import { pgTable, text, timestamp, boolean, uuid, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(), // Primary identifier
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  email: text("email").unique(), // Optional, added via profile update
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role").default("buyer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const session = pgTable("session", {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// OTP verification table
export const otpVerification = pgTable("otp_verification", {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  purpose: text("purpose", { 
    enum: ['signup', 'signin', 'phone_verification', 'password_reset'] 
  }).notNull(),
});

export const verification = pgTable("verification", {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(), // Can be email or phone
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
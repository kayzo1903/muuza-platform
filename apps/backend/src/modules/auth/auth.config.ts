// apps/backend/src/modules/auth/auth.config.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db";
import { user, session, account, verification } from "../../db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  // Disable email/password since we're using phone
  emailAndPassword: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    // Custom user fields
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: true,
        unique: true,
      },
      phoneVerified: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
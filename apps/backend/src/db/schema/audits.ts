import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey(),
  actorId: text("actor_id")
    .references(() => user.id),
  
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),   // seller_request, seller, listing
  entityId: text("entity_id").notNull(),

  payload: text("payload"), // JSON string

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

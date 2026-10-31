import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clinicCases = pgTable("clinic_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull(),
  topicId: text("topic_id").notNull(),
  kind: text("kind").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  rating: integer("rating"),
  status: text("status").notNull().default("open"),
  operatorReply: text("operator_reply").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("clinic_cases_owner_created").on(table.ownerId, table.createdAt)]);

export const insertClinicCaseSchema = createInsertSchema(clinicCases).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClinicCase = z.infer<typeof insertClinicCaseSchema>;
export type ClinicCaseRecord = typeof clinicCases.$inferSelect;

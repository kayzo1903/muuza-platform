import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';


export const sellerRequests = pgTable('seller_requests', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Business Information
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessTypes: jsonb('business_types').$type<string[]>().notNull(),
  tinNumber: varchar('tin_number', { length: 20 }).notNull().unique(),
  
  // Address Information
  region: varchar('region', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  landmark: text('landmark'),
  
  // Social Media Links
  facebook: text('facebook'),
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  whatsapp: text('whatsapp'),
  
  // Business Description
  description: text('description').notNull(),
  
  // Document References (file keys from storage service)
  documentKeys: jsonb('document_keys').$type<string[]>().notNull(),
  
  // Terms Agreement
  agreedToTerms: boolean('agreed_to_terms').notNull().default(false),
  
  // Status and Timestamps
  status: varchar('status', { 
    length: 20, 
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_NEEDED'] 
  }).notNull().default('PENDING'),
  
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by'), // References admin users table
  reviewedAt: timestamp('reviewed_at'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Foreign Key to user who submitted the request
  submittedBy: uuid('submitted_by').notNull(), // References users table
});



export const sellerRequestDocuments = pgTable("seller_request_documents", {
   id: uuid('id').primaryKey().defaultRandom(),
  requestId: varchar("request_id")
    .notNull()
    .references(() => sellerRequests.id, { onDelete: "cascade" }),

  fileKey: text("file_key").notNull(), // S3 key
  fileType: text("file_type").notNull(), // pdf, image
  metadata: text("metadata"),

  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

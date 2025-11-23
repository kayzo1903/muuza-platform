// apps/backend/src/modules/sellerRequests/sr.validation.ts
import { z } from 'zod';

// Input Schema for Creating a Request
// Enforces T&C Section 3: "Submit accurate business information" [cite: 9, 81-86]
// Updated sr.validation.ts
export const createSellerRequestSchema = z.object({
  businessName: z.string().min(3, "Business Name is required"),
  businessTypes: z.array(z.string()).min(1, "At least one business type is required"),
  tinNumber: z.string().regex(/^\d{9}$/, "TIN must be 9 digits"),
  
  // Address fields
  region: z.string().min(2, "Region is required"),
  district: z.string().min(2, "District is required"),
  street: z.string().min(2, "Street is required"),
  landmark: z.string().optional(),
  
  // Social media (optional)
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().url().optional().or(z.literal("")),
  
  description: z.string().min(10, "Description must be at least 10 characters"),
  documentKeys: z.array(z.string()).min(1, "At least one document is required"),
  agree: z.boolean().refine(val => val === true, "Must agree to terms")
});

// Output Schema (What the API returns)
export const sellerRequestResponseSchema = createSellerRequestSchema.extend({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  submittedAt: z.date(),
});

export type CreateSellerRequestInput = z.infer<typeof createSellerRequestSchema>;
// apps/backend/src/modules/auth/auth.validation.ts
import { z } from "zod";

// Phone number validation (adjust regex for Tanzania format)
const phoneRegex = /^(\+255|0)[67]\d{8}$/; // Tanzania: +255 6XX XXX XXX or +255 7XX XXX XXX

export const phoneNumberSchema = z
  .string()
  .regex(phoneRegex, "Invalid phone number format. Use +255XXXXXXXXX or 0XXXXXXXXX");

export const requestOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  purpose: z.enum(['signup', 'signin', 'phone_verification']),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(['signup', 'signin', 'phone_verification']),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phoneNumber: phoneNumberSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const signInSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  image: z.string().url().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1, "Verification token is required"),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
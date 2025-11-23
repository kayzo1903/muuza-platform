// apps/backend/src/modules/auth/auth.service.ts
import { db } from "../../db";
import { user, session } from "../../db/schema/auth";
import { eq } from "drizzle-orm";
import { SignUpInput, UpdateProfileInput } from "./auth.validation";
import { verifyOtp } from "./otp.service";

export const createUser = async (data: SignUpInput) => {
  // Verify OTP first
  const otpResult = await verifyOtp(data.phoneNumber, data.otp, 'signup');
  
  if (!otpResult.valid) {
    throw new Error(otpResult.message);
  }

  // Check if user already exists
  const existingUser = await getUserByPhoneNumber(data.phoneNumber);
  if (existingUser) {
    throw new Error("User with this phone number already exists");
  }

  // Create user
  const [newUser] = await db
    .insert(user)
    .values({
      name: data.name,
      phoneNumber: data.phoneNumber,
      phoneVerified: true, // Verified via OTP
      role: "buyer",
    })
    .returning();

  return newUser;
};

export const signInUser = async (phoneNumber: string, otp: string) => {
  // Verify OTP
  const otpResult = await verifyOtp(phoneNumber, otp, 'signin');
  
  if (!otpResult.valid) {
    throw new Error(otpResult.message);
  }

  // Get user
  const foundUser = await getUserByPhoneNumber(phoneNumber);
  
  if (!foundUser) {
    throw new Error("User not found");
  }

  if (!foundUser.isActive) {
    throw new Error("Account is inactive");
  }

  // Create session token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [newSession] = await db
    .insert(session)
    .values({
      userId: foundUser.id,
      token,
      expiresAt,
    })
    .returning();

  return { user: foundUser, session: newSession };
};

export const getUserById = async (userId: string) => {
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return foundUser;
};

export const getUserByPhoneNumber = async (phoneNumber: string) => {
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.phoneNumber, phoneNumber))
    .limit(1);

  return foundUser;
};

export const getUserByEmail = async (email: string) => {
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return foundUser;
};

export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileInput
) => {
  const [updatedUser] = await db
    .update(user)
    .set({ 
      ...data, 
      updatedAt: new Date(),
      // If email is being added, mark as unverified
      ...(data.email && { emailVerified: false }),
    })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
};

export const updateUserRole = async (userId: string, role: string) => {
  const [updatedUser] = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
};

export const deleteUser = async (userId: string) => {
  await db.delete(user).where(eq(user.id, userId));
};

export const verifyEmailAddress = async (userId: string, email: string) => {
  // Send email verification link
  // TODO: Implement email sending service
  const token = crypto.randomUUID();
  
  // Store token in verification table
  // Send email with verification link
  
  return { success: true, message: "Verification email sent" };
};
// apps/backend/src/modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import {
  requestOtpSchema,
  verifyOtpSchema,
  signUpSchema,
  signInSchema,
  updateProfileSchema,
} from "./auth.validation";
import {
  createUser,
  signInUser,
  updateUserProfile,
  getUserById,
} from "./auth.service";
import { createOtp, sendOtp } from "./otp.service";
import { requireAuth } from "./auth.middleware";

export async function authRoutes(fastify: FastifyInstance) {
  // Request OTP for signup/signin
  fastify.post("/auth/request-otp", async (request, reply) => {
    try {
      const data = requestOtpSchema.parse(request.body);

      const { otp, otpRecord } = await createOtp(
        data.phoneNumber,
        data.purpose
      );

      // Send OTP via SMS
      await sendOtp(data.phoneNumber, otp);

      return reply.send({
        success: true,
        message: "OTP sent successfully",
        // Don't send OTP in production, only for development
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    } catch (error: any) {
      return reply.status(400).send({
        error: "OTP Request Error",
        message: error.message || "Failed to send OTP",
      });
    }
  });

  // Sign up with phone number and OTP
  fastify.post("/auth/signup", async (request, reply) => {
    try {
      const data = signUpSchema.parse(request.body);

      const newUser = await createUser(data);

      // Auto sign-in after signup
      const { user: signedInUser, session } = await signInUser(
        data.phoneNumber,
        data.otp
      );

      return reply.status(201).send({
        success: true,
        message: "Account created successfully",
        data: {
          user: signedInUser,
          token: session.token,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        error: "Signup Error",
        message: error.message || "Failed to create account",
      });
    }
  });

  // Sign in with phone number and OTP
  fastify.post("/auth/signin", async (request, reply) => {
    try {
      const data = signInSchema.parse(request.body);

      const { user, session } = await signInUser(
        data.phoneNumber,
        data.otp
      );

      return reply.send({
        success: true,
        message: "Signed in successfully",
        data: {
          user,
          token: session.token,
        },
      });
    } catch (error: any) {
      return reply.status(401).send({
        error: "Sign In Error",
        message: error.message || "Invalid credentials",
      });
    }
  });

  // Get current user
  fastify.get(
    "/auth/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      return reply.send({
        success: true,
        data: request.user,
      });
    }
  );

  // Update profile (including adding email)
  fastify.patch(
    "/auth/profile",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const data = updateProfileSchema.parse(request.body);
        const userId = request.user!.id;

        const updatedUser = await updateUserProfile(userId, data);

        return reply.send({
          success: true,
          message: "Profile updated successfully",
          data: updatedUser,
        });
      } catch (error: any) {
        return reply.status(400).send({
          error: "Update Error",
          message: error.message || "Failed to update profile",
        });
      }
    }
  );

  // Sign out
  fastify.post(
    "/auth/signout",
    { preHandler: requireAuth },
    async (request, reply) => {
      // TODO: Implement session invalidation
      return reply.send({
        success: true,
        message: "Signed out successfully",
      });
    }
  );
}
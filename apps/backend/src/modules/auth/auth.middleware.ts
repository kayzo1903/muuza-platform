// apps/backend/src/modules/auth/auth.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { session, user } from "../../db/schema/auth";
import { eq, and, gt } from "drizzle-orm";

export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Missing or invalid authorization header",
    });
  }

  const token = authHeader.substring(7);

  try {
    // Find session by token
    const [userSession] = await db
      .select({
        session: session,
        user: user,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date()) // Check if not expired
        )
      )
      .limit(1);

    if (!userSession) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired session",
      });
    }

    // Check if user is active
    if (!userSession.user.isActive) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Account is inactive",
      });
    }

    // Attach user to request
    request.user = {
      id: userSession.user.id,
      name: userSession.user.name,
      phoneNumber: userSession.user.phoneNumber,
      email: userSession.user.email || undefined,
      role: userSession.user.role,
      phoneVerified: userSession.user.phoneVerified,
    };
  } catch (error) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // First check authentication
    await requireAuth(request, reply);

    const userRole = request.user?.role || "buyer";

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Insufficient permissions",
      });
    }
  };
};

export const requirePhoneVerified = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  await requireAuth(request, reply);

  if (!request.user?.phoneVerified) {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Phone number not verified",
    });
  }
};

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      name: string;
      phoneNumber: string;
      email?: string;
      role: string;
      phoneVerified: boolean;
    };
  }
}
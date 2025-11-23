// apps/backend/src/modules/sellerRequests/sr.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { createRequest, getRequestsByUser } from './sr.service';
import { CreateSellerRequestInput } from './sr.validation';

export const submitRequest = async (
  req: FastifyRequest<{ Body: CreateSellerRequestInput }>,
  reply: FastifyReply
) => {
  // In a real app, userId comes from the session/Better-Auth
  const userId = req.headers['x-user-id'] as string || 'test-user-uuid'; 
  
  const result = await createRequest(userId, req.body);
  
  // Return 201 Created and the request ID [cite: 170]
  return reply.status(201).send(result);
};

export const getUserRequests = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = req.headers['x-user-id'] as string || 'test-user-uuid';
  const requests = await getRequestsByUser(userId);
  return reply.status(200).send(requests);
};
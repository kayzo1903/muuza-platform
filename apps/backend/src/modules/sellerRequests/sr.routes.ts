// apps/backend/src/modules/sellerRequests/sr.routes.ts
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { submitRequest, getUserRequests } from './sr.controller';
import { createSellerRequestSchema, sellerRequestResponseSchema } from './sr.validation';

export const srRoutes: FastifyPluginAsyncZod = async (app) => {
  
  // POST /api/seller-requests
  app.post('/', {
    schema: {
      tags: ['Seller Onboarding'],
      description: 'Submit a new seller registration request',
      body: createSellerRequestSchema, // Zod validates body automatically
      response: {
        201: sellerRequestResponseSchema // Zod validates response structure
      }
    }
  }, submitRequest);

  // GET /api/seller-requests/me
  app.get('/me', {
    schema: {
      tags: ['Seller Onboarding'],
      description: 'Get my submitted requests'
    }
  }, getUserRequests);
};
// apps/backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

// Import Routes
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { srRoutes } from './modules/sellerRequests/sr.routes';
import { docsRoutes } from './modules/documents/docs.routes';
import { adminRoutes } from './modules/adminReview/admin.routes';
import { sellersRoutes } from './modules/sellers/sellers.routes';
import { listingsRoutes } from './modules/listings/listings.routes';

const buildServer = async () => {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Global Config
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cors, { origin: ['http://localhost:3000', 'http://localhost:3001'] });

  // Register Modules (The "Modular" Structure)
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(srRoutes, { prefix: '/api/seller-requests' }); // [cite: 169-170]
  app.register(docsRoutes, { prefix: '/api/documents' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(sellersRoutes, { prefix: '/api/sellers' });
  app.register(listingsRoutes, { prefix: '/api/listings' });

  return app;
};

// Start Server
const start = async () => {
  const app = await buildServer();
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
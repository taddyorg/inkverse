import express from 'express';
import cors from 'cors';
import http from 'http';
import type { ValidationRule } from 'graphql';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { depthLimit } from './graphql/validators/depth-limit.js';
import { requiredFields } from './graphql/validators/required-fields.js';
import { createComplexityLimitRule } from './graphql/validators/complexity-cost/index.js';
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { typeDefs, resolvers } from './graphql/index.js';
import { errorMessageToJsonError, graphqlFormatError } from './graphql/error.js';
import workerRouter from './routes/worker.js';
import { createAuthContext } from './middleware/auth.js';
import authRouter from './routes/auth.js';

const PORT = 3010;
const QUERY_MAX_DEPTH = 4;

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,POST,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 3600,
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    introspection: true,
    csrfPrevention: false,
    persistedQueries: false,
    validationRules: [
      depthLimit(QUERY_MAX_DEPTH) as ValidationRule,
      createComplexityLimitRule(5000, {
        scalarCost: 1,
        objectCost: 18, 
        listFactor: 12,
        introspectionListFactor: 1,
        // onCost: (cost: number) => {
        //   console.log('cost', cost);
        // }
      } as any) as ValidationRule,
      requiredFields() as ValidationRule,
    ],
    formatError: graphqlFormatError as any,
  });

  await server.start();

  const graphqlPath = '/api/graphql';

  app.use(
    graphqlPath,
    cors(corsOptions),
    express.urlencoded({ extended: false }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Use the auth middleware to create context with user if authenticated
        return createAuthContext(req as unknown as Request);
      },
    }),
  );

  // setupFirebase();
  // setUpLogger();
  // setUpClient();

  app.get('/api', (req, res) => {
    res.send('😁')
  });

  app.use('/api/worker', workerRouter);
  app.use('/api/auth', cors(corsOptions), authRouter);

  app.use((error: any, req: any, res: any, next: any) => {
    return errorMessageToJsonError(res, error)
  });

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${graphqlPath}`);
  });

  return { server, app };
}

startServer()

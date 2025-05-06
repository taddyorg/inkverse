import { GraphQLError } from 'graphql';
import type { Response } from 'express';
import type { GraphQLFormattedError } from 'graphql';

import { validate as validateUuid } from 'uuid';
import { captureRemoteError } from '@inkverse/shared-server/utils/errors';

export function errorMessageToJsonError(res: Response, error: Error){ 
  return res.status(res.statusCode || 400).json({ error: error.toString() })
}

export function graphqlFormatError(err: GraphQLError): GraphQLFormattedError{
  const helpfulError = {
    message: getSafeErrorMessageForGraphQLError(err),
    code: getPrettyCodeForGraphQLError(err),
  };

  captureRemoteError(err);

  return helpfulError;
}

function getSafeErrorMessageForGraphQLError(err: GraphQLError): string {
  if (!err.message) { return 'Unknown error' }

  if (process.env.NODE_ENV === 'production'){
    if (err.message.startsWith('select *')){
      return 'SQL Error';
    }
  }else if (err.message.startsWith('Context creation failed: ')){
    return err.message.replace("Context creation failed: ", "");
  }

  return err.message
}

function getPrettyCodeForGraphQLError(err: GraphQLError): string {
  switch (err.extensions.code){
    case 'INTERNAL_SERVER_ERROR':
      return 'INKVERSE_SERVER_ERROR';
    case 'GRAPHQL_PARSE_FAILED':
    case 'GRAPHQL_VALIDATION_FAILED':
      return 'INVALID_QUERY_OR_SYNTAX';
    case 'UNAUTHENTICATED':
      return 'REQUIRES_USER_AUTHENTICATION';
    case 'FORBIDDEN':
      return 'ACCESS_NOT_ALLOWED';
    default:
      return err.extensions.code as string;
  }
}

export function validateAndTrimUuid(id: string | null, name = 'uuid'): string {
  if (!id) {
    throw new UserInputError(`${name} is null!`);
  }

  const trimmedId = id.trim();

  if (!validateUuid(trimmedId)) {
    throw new UserInputError(`${id} is not a valid ${name}`);
  }

  return trimmedId;
}

class ApiKeyInvalidError extends GraphQLError {
  constructor(message: string) {
    const defaultMessage = 'The X-API-KEY or X-USER-ID headers are missing or invalid. Please check they are set properly and contact danny@inkverse.co if you need help.'
    super(message || defaultMessage, {
      extensions: { code: 'API_KEY_INVALID' },
    });

    Object.defineProperty(this, 'name', { value: 'ApiKeyInvalidError' });
  }
}

class ApiRateLimitExceededError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'API_RATE_LIMIT_EXCEEDED' },
    });

    Object.defineProperty(this, 'name', { value: 'ApiRateLimitExceededError' });
  }
}

class QueryTooComplexError extends GraphQLError {
  constructor(message: string, options?: any) {
    super(message, {
      extensions: { code: 'QUERY_TOO_COMPLEX', ...options },
    });

    Object.defineProperty(this, 'name', { value: 'QueryTooComplexError' });
  }
}

class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED' },
    });

    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'FORBIDDEN' },
    });

    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}

class UserInputError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'BAD_USER_INPUT' },
    });

    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

class SyntaxError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'GRAPHQL_PARSE_FAILED' },
    });

    Object.defineProperty(this, 'name', { value: 'SyntaxError' });
  }
}

class ValidationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    });

    Object.defineProperty(this, 'name', { value: 'ValidationError' });
  }
}

export {
  ApiKeyInvalidError,
  ApiRateLimitExceededError,
  QueryTooComplexError,
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  SyntaxError,
  ValidationError
};

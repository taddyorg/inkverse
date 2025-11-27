/**
 * Type declaration to resolve Apollo Client type mismatch between
 * root node_modules and react-native workspace paths
 */

declare module '@apollo/client' {
  // Core exports
  export { 
    ApolloClient,
    ObservableQuery,
    NetworkStatus,
    CombinedGraphQLErrors,
    CombinedProtocolErrors,
    LinkError,
    LocalStateError,
    ServerError,
    ServerParseError,
    UnconventionalError
  } from '../node_modules/@apollo/client/core';
  
  // Cache exports
  export {
    ApolloCache,
    defaultDataIdFromObject,
    InMemoryCache,
    makeVar,
    MissingFieldError
  } from '../node_modules/@apollo/client/cache';
  
  // Link exports
  export {
    ApolloLink,
    concat,
    empty,
    execute,
    from,
    split
  } from '../node_modules/@apollo/client/link';
  
  // HTTP Link exports
  export {
    checkFetcher,
    createHttpLink,
    createSignalIfSupported,
    defaultPrinter,
    fallbackHttpConfig,
    HttpLink,
    parseAndCheckHttpResponse,
    rewriteURIForGET,
    selectHttpOptionsAndBody,
    selectHttpOptionsAndBodyInternal,
    selectURI
  } from '../node_modules/@apollo/client/link/http';
  
  // Re-export all types
  export type * from '../node_modules/@apollo/client/core';
  export type * from '../node_modules/@apollo/client/cache';
  export type * from '../node_modules/@apollo/client/link';
  export type * from '../node_modules/@apollo/client/link/http';
}

declare module '@apollo/client/core' {
  export * from '../node_modules/@apollo/client/core';
}

declare module '@apollo/client/link' {
  export * from '../node_modules/@apollo/client/link';
}

declare module '@apollo/client/link/http' {
  export * from '../node_modules/@apollo/client/link/http';
}

declare module '@apollo/client/link/context' {
  export { SetContextLink, setContext } from '../node_modules/@apollo/client/link/context';
  export type * from '../node_modules/@apollo/client/link/context';
}

declare module '@apollo/client/link/error' {
  export { ErrorLink, onError } from '../node_modules/@apollo/client/link/error';
  export type * from '../node_modules/@apollo/client/link/error';
}

declare module '@apollo/client/errors' {
  export {
    PROTOCOL_ERRORS_SYMBOL,
    graphQLResultHasProtocolErrors,
    toErrorLike,
    CombinedGraphQLErrors,
    CombinedProtocolErrors,
    isErrorLike,
    LinkError,
    registerLinkError,
    LocalStateError,
    ServerError,
    ServerParseError,
    UnconventionalError
  } from '../node_modules/@apollo/client/errors';
  export type * from '../node_modules/@apollo/client/errors';
}

declare module '@apollo/client/cache' {
  export * from '../node_modules/@apollo/client/cache';
}
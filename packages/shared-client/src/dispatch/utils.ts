import type { User } from "../graphql/operations";

export enum ActionTypes {
  GET_HOMEFEED = 'GET_HOMEFEED',
  GET_COMICSERIES = 'GET_COMICSERIES',
  GET_COMICISSUE = 'GET_COMICISSUE',
  GET_CREATOR = 'GET_CREATOR',
  GET_LIST = 'GET_LIST',
  SEARCH = 'SEARCH',
  COMICS_LIST = 'COMICS_LIST',
  REPORT_COMIC_SERIES = 'REPORT_COMIC_SERIES',
  CONNECT_HOSTING_PROVIDER = 'CONNECT_HOSTING_PROVIDER',
  FETCH_USER_TOKENS = 'FETCH_USER_TOKENS',
}

export type Dispatch = (action: Action | { type: string; payload?: any }) => void;

export interface AsyncActionCreators {
  REQUEST: string;
  SUCCESS: string;
  FAILURE: string;
  request: ActionCreator;
  success: ActionCreator;
  failure: ErrorActionCreator;
}

export interface Action<T = any> {
  type: string;
  payload?: T;
  meta?: any;
}

interface ErrorAction<T = any> extends Action<T> {
  error: true;
}

type ActionCreator = <Payload = unknown, Meta = unknown>(
  payload?: Payload,
  meta?: Meta
) => Action<Payload>;

type ErrorActionCreator = <Payload = unknown, Meta = unknown>(
  payload?: Payload,
  meta?: Meta
) => ErrorAction<Payload>;

export function asyncAction(actionName: ActionTypes): AsyncActionCreators {
  const actionTypes = {
    REQUEST: `${actionName}_REQUEST`,
    SUCCESS: `${actionName}_SUCCESS`,
    FAILURE: `${actionName}_FAILURE`,
  } as const;

  return {
    ...actionTypes,
    request: createAction(actionTypes.REQUEST),
    success: createAction(actionTypes.SUCCESS),
    failure: createErrorAction(actionTypes.FAILURE),
  };
}

function createAction(type: string): ActionCreator {
  return (payload, meta) => ({ type, payload, meta });
}

function createErrorAction(type: string): ErrorActionCreator {
  return (payload, meta) => ({ type, error: true, payload, meta });
}

// export interface PubSubAction {
//   name: string;
//   uuid: string;
//   id: string;
//   errorMessage?: string;
// }

export function errorHandlerFactory(
  dispatch: (action: Action | ErrorAction) => void,
  action: AsyncActionCreators,
) {
  return (error: Error | unknown) => {
    dispatch(action.failure(error));
    console.error('Error:', error);
  };
}

export function mergeItemsWithUuid<T extends { uuid: string }>(existingItems: T[], newItems: T[]): T[] {
  const existingUuids = new Set(existingItems.map(item => item.uuid));
  const uniqueNewItems = newItems.filter(item => !existingUuids.has(item.uuid));
  return [...existingItems, ...uniqueNewItems];
}

/**
 * Interface for token storage functions that will be passed to authentication methods
 * Each client (web, mobile) can implement these differently based on their storage mechanism
 */
export interface StorageFunctions {
  /** Function to save the access token (e.g., to localStorage, SecureStore, etc.) */
  saveAccessToken: (token: string) => Promise<void> | void;
  /** Function to save the refresh token */
  saveRefreshToken: (token: string) => Promise<void> | void;
  /** Function to save only essential user details */
  saveUserDetails: (user: Pick<User, 'id' | 'isEmailVerified' | 'username'>) => Promise<void> | void;
}

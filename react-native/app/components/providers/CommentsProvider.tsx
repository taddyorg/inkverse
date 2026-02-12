import React, { createContext, useContext, useReducer, useRef } from 'react';
import {
  commentsReducer,
  commentsInitialState,
  type CommentsState,
  type CommentsAction,
} from '@inkverse/shared-client/dispatch/comments';

type CommentsContextType = {
  state: CommentsState;
  dispatch: React.Dispatch<CommentsAction>;
  commentCountCallbackRef: React.MutableRefObject<((count: number) => void) | undefined>;
};

const CommentsContext = createContext<CommentsContextType | null>(null);

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(commentsReducer, commentsInitialState);
  const commentCountCallbackRef = useRef<((count: number) => void) | undefined>(undefined);
  return (
    <CommentsContext.Provider value={{ state, dispatch, commentCountCallbackRef }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) throw new Error('useComments must be used within CommentsProvider');
  return context;
}

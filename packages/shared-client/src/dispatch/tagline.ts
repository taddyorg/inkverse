import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import {
  UpdateComicSeriesTagline,
  type UpdateComicSeriesTaglineMutation,
  type UpdateComicSeriesTaglineMutationVariables,
  type ComicSeries,
} from '../graphql/operations.js';
import { emit, EventNames } from '../pubsub/index.js';
import { normalizeTagline } from '@inkverse/public/comicseries';

/* Action Type Enum */
export enum TaglineActionType {
  UPDATE_TAGLINE_START = 'UPDATE_TAGLINE_START',
  UPDATE_TAGLINE_SUCCESS = 'UPDATE_TAGLINE_SUCCESS',
  UPDATE_TAGLINE_ERROR = 'UPDATE_TAGLINE_ERROR',
  RESET_TAGLINE = 'RESET_TAGLINE',
}

/* Action Types */
export type TaglineAction =
  | { type: TaglineActionType.UPDATE_TAGLINE_START }
  | { type: TaglineActionType.UPDATE_TAGLINE_SUCCESS }
  | { type: TaglineActionType.UPDATE_TAGLINE_ERROR; payload: string }
  | { type: TaglineActionType.RESET_TAGLINE };

/* Types */
export interface TaglineState {
  isSubmitting: boolean;
  success: boolean;
  error: string | null;
}

export const taglineInitialState: TaglineState = {
  isSubmitting: false,
  success: false,
  error: null,
};

/* Helpers */
type CanEditTaglineProps = {
  isAdmin: boolean;
  userCreatorUuid: string | null | undefined;
  tagline: string | null | undefined;
  comicseries: Pick<ComicSeries, 'creators'> | null | undefined;
}

// Only decides whether to show the edit UI. The server checks permissions again when saving.
// Admins can always edit; creators of the series can edit only once an admin has set a tagline.
export function canEditComicSeriesTagline({ isAdmin, userCreatorUuid, tagline, comicseries }: CanEditTaglineProps): boolean {
  if (isAdmin) { return true }
  if (!tagline || !userCreatorUuid || !comicseries) { return false }
  return !!comicseries.creators?.some(creator => creator?.uuid === userCreatorUuid);
}

/* Action Creators */
interface UpdateComicSeriesTaglineProps {
  userClient: ApolloClient;
  seriesUuid: string;
  tagline: string;
}

export async function submitComicSeriesTagline(
  { userClient, seriesUuid, tagline }: UpdateComicSeriesTaglineProps,
  dispatch?: Dispatch<TaglineAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: TaglineActionType.UPDATE_TAGLINE_START });

  try {
    const result = await userClient.mutate<UpdateComicSeriesTaglineMutation, UpdateComicSeriesTaglineMutationVariables>({
      mutation: UpdateComicSeriesTagline,
      variables: {
        seriesUuid,
        tagline: normalizeTagline(tagline) || null,
      },
    });

    const updated = result.data?.updateComicSeriesTagline;
    if (!updated) {
      throw new Error('Failed to save tagline');
    }

    emit(EventNames.COMIC_TAGLINE_UPDATED, { seriesUuid: updated.uuid, tagline: updated.tagline ?? null });

    if (dispatch) dispatch({ type: TaglineActionType.UPDATE_TAGLINE_SUCCESS });
    return true;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to save tagline';

    if (dispatch) {
      dispatch({
        type: TaglineActionType.UPDATE_TAGLINE_ERROR,
        payload: errorMessage,
      });
    }
    return false;
  }
}

export function resetTagline(dispatch: Dispatch<TaglineAction>) {
  dispatch({ type: TaglineActionType.RESET_TAGLINE });
}

/* Reducer */
export function taglineReducer(
  state: TaglineState = taglineInitialState,
  action: TaglineAction
): TaglineState {
  switch (action.type) {
    case TaglineActionType.UPDATE_TAGLINE_START:
      return { ...state, isSubmitting: true, success: false, error: null };
    case TaglineActionType.UPDATE_TAGLINE_SUCCESS:
      return { ...state, isSubmitting: false, success: true, error: null };
    case TaglineActionType.UPDATE_TAGLINE_ERROR:
      return { ...state, isSubmitting: false, success: false, error: action.payload };
    case TaglineActionType.RESET_TAGLINE:
      return taglineInitialState;
    default:
      return state;
  }
}

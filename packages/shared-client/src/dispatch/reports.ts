import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import {
  ReportComicSeries,
  ReportComment,
  type ReportComicSeriesMutationVariables,
  type ReportComicSeriesMutation,
  type ReportCommentMutation,
  type ReportCommentMutationVariables,
  type ReportType
} from '../graphql/operations';

/* Action Type Enum */
export enum ReportActionType {
  // ComicSeries Report Operations
  REPORT_COMIC_SERIES_START = 'REPORT_COMIC_SERIES_START',
  REPORT_COMIC_SERIES_SUCCESS = 'REPORT_COMIC_SERIES_SUCCESS',
  REPORT_COMIC_SERIES_ERROR = 'REPORT_COMIC_SERIES_ERROR',
  // Comment Report Operations
  REPORT_COMMENT_START = 'REPORT_COMMENT_START',
  REPORT_COMMENT_SUCCESS = 'REPORT_COMMENT_SUCCESS',
  REPORT_COMMENT_ERROR = 'REPORT_COMMENT_ERROR',
  // Shared
  RESET_REPORT = 'REPORT_RESET',
}

/* Action Types */
export type ReportAction =
  // ComicSeries Report Operations
  | { type: ReportActionType.REPORT_COMIC_SERIES_START }
  | { type: ReportActionType.REPORT_COMIC_SERIES_SUCCESS }
  | { type: ReportActionType.REPORT_COMIC_SERIES_ERROR; payload: string }
  // Comment Report Operations
  | { type: ReportActionType.REPORT_COMMENT_START }
  | { type: ReportActionType.REPORT_COMMENT_SUCCESS }
  | { type: ReportActionType.REPORT_COMMENT_ERROR; payload: string }
  // Shared
  | { type: ReportActionType.RESET_REPORT };

/* Types */
export interface ReportState {
  isSubmitting: boolean;
  success: boolean;
  error: string | null;
}

export const reportInitialState: ReportState = {
  isSubmitting: false,
  success: false,
  error: null
};

/* Action Creators */
interface ReportComicSeriesProps {
  userClient: ApolloClient;
  uuid: string;
  reportType: ReportType;
}

export async function submitReportComicSeries(
  { userClient, uuid, reportType }: ReportComicSeriesProps, 
  dispatch?: Dispatch<ReportAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: ReportActionType.REPORT_COMIC_SERIES_START });

  try {
    const result = await userClient.mutate<ReportComicSeriesMutation, ReportComicSeriesMutationVariables>({
      mutation: ReportComicSeries,
      variables: { 
        uuid,
        reportType
      },
    });

    if (result.data?.reportComicSeries) {
      if (dispatch) {
        dispatch({ type: ReportActionType.REPORT_COMIC_SERIES_SUCCESS });
      }
      return true;
    } else {
      throw new Error("Failed to submit report");
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to submit report';
    
    if (dispatch) {
      dispatch({ 
        type: ReportActionType.REPORT_COMIC_SERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return false;
  }
}

export function resetReportComicSeries(dispatch: Dispatch<ReportAction>) {
  dispatch({ type: ReportActionType.RESET_REPORT });
}

/* Comment Report Action Creator */
interface ReportCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  reportType: ReportType;
  additionalInfo?: string | null;
}

export async function submitReportComment(
  { userClient, commentUuid, reportType, additionalInfo }: ReportCommentProps,
  dispatch?: Dispatch<ReportAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: ReportActionType.REPORT_COMMENT_START });

  try {
    const result = await userClient.mutate<ReportCommentMutation, ReportCommentMutationVariables>({
      mutation: ReportComment,
      variables: {
        commentUuid,
        reportType,
        additionalInfo
      },
    });

    if (result.data?.reportComment) {
      if (dispatch) {
        dispatch({ type: ReportActionType.REPORT_COMMENT_SUCCESS });
      }
      return true;
    } else {
      throw new Error("Failed to submit report");
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to submit report';

    if (dispatch) {
      dispatch({
        type: ReportActionType.REPORT_COMMENT_ERROR,
        payload: errorMessage
      });
    }
    return false;
  }
}

export function resetReport(dispatch: Dispatch<ReportAction>) {
  dispatch({ type: ReportActionType.RESET_REPORT });
}

/* Reducer */
export function reportReducer(
  state: ReportState = reportInitialState, 
  action: ReportAction
): ReportState {
  switch (action.type) {
    case ReportActionType.REPORT_COMIC_SERIES_START:
      return {
        ...state,
        isSubmitting: true,
        success: false,
        error: null
      };
    case ReportActionType.REPORT_COMIC_SERIES_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        success: true,
        error: null
      };
    case ReportActionType.REPORT_COMIC_SERIES_ERROR:
      return {
        ...state,
        isSubmitting: false,
        success: false,
        error: action.payload
      };
    case ReportActionType.REPORT_COMMENT_START:
      return {
        ...state,
        isSubmitting: true,
        success: false,
        error: null
      };
    case ReportActionType.REPORT_COMMENT_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        success: true,
        error: null
      };
    case ReportActionType.REPORT_COMMENT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        success: false,
        error: action.payload
      };
    case ReportActionType.RESET_REPORT:
      return reportInitialState;
    default:
      return state;
  }
}
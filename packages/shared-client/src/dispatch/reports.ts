import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { ReportComicSeries, type ReportComicSeriesMutationVariables, type ReportComicSeriesMutation } from '../graphql/operations';

/* Action Type Enum */
export enum ReportActionType {
  // Report Operations
  REPORT_COMIC_SERIES_START = 'REPORT_COMIC_SERIES_START',
  REPORT_COMIC_SERIES_SUCCESS = 'REPORT_COMIC_SERIES_SUCCESS',
  REPORT_COMIC_SERIES_ERROR = 'REPORT_COMIC_SERIES_ERROR',
  RESET_REPORT = 'REPORT_RESET',
}

/* Action Types */
export type ReportAction =
  // Report Operations
  | { type: ReportActionType.REPORT_COMIC_SERIES_START }
  | { type: ReportActionType.REPORT_COMIC_SERIES_SUCCESS }
  | { type: ReportActionType.REPORT_COMIC_SERIES_ERROR; payload: string }
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
  publicClient: ApolloClient;
  uuid: string;
  reportType: string;
}

export async function submitReportComicSeries(
  { publicClient, uuid, reportType }: ReportComicSeriesProps, 
  dispatch?: Dispatch<ReportAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: ReportActionType.REPORT_COMIC_SERIES_START });

  try {
    const result = await publicClient.mutate<ReportComicSeriesMutation, ReportComicSeriesMutationVariables>({
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
    case ReportActionType.RESET_REPORT:
      return reportInitialState;
    default:
      return state;
  }
}
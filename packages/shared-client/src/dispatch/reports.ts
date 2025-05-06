import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import gql from 'graphql-tag';

/* Actions */
export const REPORT_COMIC_SERIES = asyncAction(ActionTypes.REPORT_COMIC_SERIES);
/* GraphQL Mutation */
export const ReportComicSeriesMutation = gql`
  mutation ReportComicSeries($uuid: ID!, $reportType: String) {
    reportComicSeries(uuid: $uuid, reportType: $reportType)
  }
`;

/* Types */
export interface ReportState {
  isSubmitting: boolean;
  success: boolean;
  error: Error | null;
}

export const reportInitialState: ReportState = {
  isSubmitting: false,
  success: false,
  error: null
};

/* Action Creators */
interface ReportComicSeriesProps {
  publicClient: ApolloClient<any>;
  uuid: string;
  reportType: string;
}

export async function submitReportComicSeries(
  { publicClient, uuid, reportType }: ReportComicSeriesProps, 
  dispatch: Dispatch
) {
  dispatch(REPORT_COMIC_SERIES.request());

  try {
    const result = await publicClient.mutate({
      mutation: ReportComicSeriesMutation,
      variables: { 
        uuid,
        reportType
      },
    });

    if (result.data?.reportComicSeries) {
      dispatch(REPORT_COMIC_SERIES.success({ success: true }));
      return true;
    } else {
      throw new Error("Failed to submit report");
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, REPORT_COMIC_SERIES)(error);
    return false;
  }
}

export function resetReportComicSeries(dispatch: Dispatch) {
  dispatch(REPORT_COMIC_SERIES.failure({ error: null }));
}

/* Reducers */
export function reportReducer(state = reportInitialState, action: Action): ReportState {
  switch (action.type) {
    case REPORT_COMIC_SERIES.REQUEST:
      return {
        ...state,
        isSubmitting: true,
        success: false,
        error: null
      };
    case REPORT_COMIC_SERIES.SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        success: true,
        error: null
      };
    case REPORT_COMIC_SERIES.FAILURE:
      return {
        ...state,
        isSubmitting: false,
        success: false,
        error: action.payload
      };
    default:
      return state;
  }
} 
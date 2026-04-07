import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import {
  GetNotificationSettings,
  GetMeDetails,
  AddOrUpdateNotificationSetting,
  type GetNotificationSettingsQuery,
  type GetMeDetailsQuery,
  type AddOrUpdateNotificationSettingMutation,
  type AddOrUpdateNotificationSettingMutationVariables,
} from '../graphql/operations.js';

export type NotificationSettingStatus = NonNullable<GetNotificationSettingsQuery['getNotificationSettings']['settings'][number]>;

/* Action Type Enum */
export enum NotificationSettingsActionType {
  LOAD_SETTINGS_START = 'LOAD_SETTINGS_START',
  LOAD_SETTINGS_SUCCESS = 'LOAD_SETTINGS_SUCCESS',
  LOAD_SETTINGS_ERROR = 'LOAD_SETTINGS_ERROR',
  UPDATE_SETTING_START = 'UPDATE_SETTING_START',
  UPDATE_SETTING_SUCCESS = 'UPDATE_SETTING_SUCCESS',
  UPDATE_SETTING_ERROR = 'UPDATE_SETTING_ERROR',
}

export type NotificationSettingsAction =
  | { type: NotificationSettingsActionType.LOAD_SETTINGS_START }
  | { type: NotificationSettingsActionType.LOAD_SETTINGS_SUCCESS; payload: { settings: NotificationSettingStatus[]; isCreator: boolean } }
  | { type: NotificationSettingsActionType.LOAD_SETTINGS_ERROR; payload: string }
  | { type: NotificationSettingsActionType.UPDATE_SETTING_START; payload: { eventType: string; channel: string; isEnabled: boolean } }
  | { type: NotificationSettingsActionType.UPDATE_SETTING_SUCCESS; payload: NotificationSettingStatus }
  | { type: NotificationSettingsActionType.UPDATE_SETTING_ERROR; payload: string };

export type NotificationSettingsState = {
  isLoading: boolean;
  isCreator: boolean;
  settings: NotificationSettingStatus[];
  error: string | null;
};

export const notificationSettingsInitialState: NotificationSettingsState = {
  isLoading: false,
  isCreator: false,
  settings: [],
  error: null,
};

type LoadSettingsProps = {
  userClient: ApolloClient;
};

export async function loadNotificationSettings(
  { userClient }: LoadSettingsProps,
  dispatch?: Dispatch<NotificationSettingsAction>
): Promise<NotificationSettingStatus[] | null> {
  if (dispatch) dispatch({ type: NotificationSettingsActionType.LOAD_SETTINGS_START });

  try {
    const [settingsResult, meResult] = await Promise.all([
      userClient.query<GetNotificationSettingsQuery>({
        query: GetNotificationSettings,
        fetchPolicy: 'network-only',
      }),
      userClient.query<GetMeDetailsQuery>({
        query: GetMeDetails,
        fetchPolicy: 'network-only',
      }),
    ]);

    const settings = settingsResult.data?.getNotificationSettings?.settings || [];
    const isCreator = !!meResult.data?.me?.creator;

    if (dispatch) {
      dispatch({
        type: NotificationSettingsActionType.LOAD_SETTINGS_SUCCESS,
        payload: { settings: settings as NotificationSettingStatus[], isCreator },
      });
    }

    return settings as NotificationSettingStatus[];
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to load notification settings';
    if (dispatch) {
      dispatch({ type: NotificationSettingsActionType.LOAD_SETTINGS_ERROR, payload: errorMessage });
    }
    return null;
  }
}

type UpdateSettingProps = {
  userClient: ApolloClient;
  eventType: string;
  channel: string;
  isEnabled: boolean;
};

export async function addOrUpdateNotificationSetting(
  { userClient, eventType, channel, isEnabled }: UpdateSettingProps,
  dispatch?: Dispatch<NotificationSettingsAction>
): Promise<NotificationSettingStatus | null> {
  if (dispatch) dispatch({ type: NotificationSettingsActionType.UPDATE_SETTING_START, payload: { eventType, channel, isEnabled } });

  try {
    const result = await userClient.mutate<
      AddOrUpdateNotificationSettingMutation,
      AddOrUpdateNotificationSettingMutationVariables
    >({
      mutation: AddOrUpdateNotificationSetting,
      variables: {
        eventType: eventType as any,
        channel: channel as any,
        isEnabled,
      },
    });

    const setting = result.data?.addOrUpdateNotificationSetting;
    if (!setting) throw new Error('No data returned');

    if (dispatch) {
      dispatch({
        type: NotificationSettingsActionType.UPDATE_SETTING_SUCCESS,
        payload: setting as NotificationSettingStatus,
      });
    }

    return setting as NotificationSettingStatus;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to update notification setting';
    if (dispatch) {
      dispatch({ type: NotificationSettingsActionType.UPDATE_SETTING_ERROR, payload: errorMessage });
    }
    return null;
  }
}

export function notificationSettingsReducer(
  state: NotificationSettingsState = notificationSettingsInitialState,
  action: NotificationSettingsAction
): NotificationSettingsState {
  switch (action.type) {
    case NotificationSettingsActionType.LOAD_SETTINGS_START:
      return { ...state, isLoading: true, error: null };
    case NotificationSettingsActionType.LOAD_SETTINGS_SUCCESS:
      return { ...state, isLoading: false, settings: action.payload.settings, isCreator: action.payload.isCreator, error: null };
    case NotificationSettingsActionType.LOAD_SETTINGS_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case NotificationSettingsActionType.UPDATE_SETTING_START: {
      const { eventType, channel, isEnabled } = action.payload;
      const exists = state.settings.some((s) => s.eventType === eventType && s.channel === channel);
      const settings = exists
        ? state.settings.map((s) =>
            s.eventType === eventType && s.channel === channel ? { ...s, isEnabled } : s
          )
        : [...state.settings, { eventType, channel, isEnabled } as NotificationSettingStatus];
      return { ...state, settings, error: null };
    }
    case NotificationSettingsActionType.UPDATE_SETTING_SUCCESS: {
      const updated = action.payload;
      const exists = state.settings.some((s) => s.eventType === updated.eventType && s.channel === updated.channel);
      const settings = exists
        ? state.settings.map((s) =>
            s.eventType === updated.eventType && s.channel === updated.channel ? updated : s
          )
        : [...state.settings, updated];
      return { ...state, settings };
    }
    case NotificationSettingsActionType.UPDATE_SETTING_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

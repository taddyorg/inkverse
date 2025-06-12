import { DeviceEventEmitter, EmitterSubscription } from 'react-native';

// Define event types
export const PubSubEvents = {
  HOSTING_PROVIDER_CONNECTED: 'HOSTING_PROVIDER_CONNECTED',
} as const;

export type PubSubEventType = typeof PubSubEvents[keyof typeof PubSubEvents];

// Event data types
export interface HostingProviderConnectedData {
  hostingProviderUuid: string;
  success: boolean;
}

// PubSub interface
export const PubSub = {
  emit: <T = any>(event: PubSubEventType, data?: T) => {
    DeviceEventEmitter.emit(event, data);
  },
  
  subscribe: <T = any>(
    event: PubSubEventType, 
    callback: (data: T) => void
  ): EmitterSubscription => {
    return DeviceEventEmitter.addListener(event, callback);
  },
  
  removeAllListeners: (event?: PubSubEventType) => {
    if (event) {
      DeviceEventEmitter.removeAllListeners(event);
    } else {
      DeviceEventEmitter.removeAllListeners();
    }
  },
};
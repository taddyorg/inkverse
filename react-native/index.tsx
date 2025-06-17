import { registerRootComponent } from 'expo';
import App from './app/screens/root';
import { migrateAsyncStorageToSyncStorage } from './lib/storage/sync';
import { USER_DETAILS_KEY } from './lib/auth/user';
import { HOSTING_PROVIDER_UUIDS_KEY } from './lib/auth/hosting-provider';

registerRootComponent(App); 

migrateAsyncStorageToSyncStorage([USER_DETAILS_KEY, HOSTING_PROVIDER_UUIDS_KEY]);
import { registerRootComponent } from 'expo';
import App from './app/screens/root';
import { migrateAsyncStorageToSyncStorage } from './lib/storage/sync';
import { USER_DETAILS_KEY } from './lib/auth/user';

registerRootComponent(App); 

migrateAsyncStorageToSyncStorage([USER_DETAILS_KEY]);
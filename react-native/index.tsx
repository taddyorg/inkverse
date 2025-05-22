import { registerRootComponent } from 'expo';
import App from './app/screens/root';
import { migrateAsyncStorageToSyncStorage } from './lib/storage/sync';

registerRootComponent(App); 

migrateAsyncStorageToSyncStorage();
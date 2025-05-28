import * as Sentry from '@sentry/node';
import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const testProductionErrorHandling = false;

export function setUpLogger(){
  try{
    Sentry.init({
      dsn: process.env.SENTRY_URL,
    });
  }catch(e){
    console.error('error in Sentry setUpLogger', e);
  }
}

export function captureRemoteError(error: Error, safeErrorMessage?: string) {
  try{
    // Capture the error in Sentry
    Sentry.captureException(error);

    // Log the error for debugging
    console.error("Error from captureRemoteError", safeErrorMessage, error);
  }catch(e){
    console.error('error in Sentry captureRemoteError', e);
  }
}

// Logs the error in Sentry and returns a safe error message for the client
export function getSafeError(untypedError: any, safeErrorMessage: string) {  
  const errorInstance = untypedError instanceof Error 
    ? untypedError 
    : new Error(String(untypedError) ?? 'Unknown error');

  const safeError = testProductionErrorHandling || process.env.NODE_ENV === 'production' 
    ? new Error(safeErrorMessage)
    : errorInstance
  
  // Capture + log the error
  captureRemoteError(errorInstance, safeErrorMessage);

  return safeError
}
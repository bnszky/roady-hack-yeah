import { Platform } from 'react-native';

const LOCALHOST = 'localhost';
/** The Android emulator reaches the host machine via 10.0.2.2, not localhost. */
const ANDROID_HOST = '10.0.2.2';

function getEnv(name: string): string {
  return process.env[name] ?? '';
}

export const env = {
  apiUrl: getEnv('EXPO_PUBLIC_API_URL') || 'http://localhost:8000',
  supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
};

/**
 * Base URL of our FastAPI backend.
 * On Android emulators `localhost` points to the emulator itself, so we rewrite
 * it to `10.0.2.2`. On a physical device set EXPO_PUBLIC_API_URL to your LAN IP.
 */
export const API_URL =
  Platform.OS === 'android' ? env.apiUrl.replace(LOCALHOST, ANDROID_HOST) : env.apiUrl;

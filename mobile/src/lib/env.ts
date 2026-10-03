import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { NativeModules, Platform } from 'react-native';

// Expo inlines only static `process.env.EXPO_PUBLIC_*` reads into the bundle;
// dynamic `process.env[name]` lookups come back empty on device.
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '',
};

const LOOPBACK = /^(localhost|127\.0\.0\.1)$/;
/** The Android emulator reaches the host machine via 10.0.2.2, not localhost. */
const ANDROID_EMULATOR_HOST = '10.0.2.2';

/** Host of the dev machine as seen by the app: the address Metro serves the bundle from. */
function devMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri;
  const scriptUrl: string | undefined = NativeModules.SourceCode?.scriptURL;
  for (const candidate of [hostUri, scriptUrl]) {
    if (!candidate) continue;
    const host = candidate.replace(/^\w+:\/\//, '').split(/[:/]/)[0];
    if (host && !LOOPBACK.test(host)) return host;
  }
  return null;
}

/**
 * Base URL of our FastAPI backend. A `localhost` URL is rewritten so it points at the
 * dev machine: `10.0.2.2` on the Android emulator, the Metro host's LAN IP on a physical
 * phone (run the backend with `--host 0.0.0.0`). Any other host is used as is.
 */
function resolveApiUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (!LOOPBACK.test(url.hostname) || Platform.OS === 'web') return raw.replace(/\/$/, '');

  const host =
    Platform.OS === 'android' && !Device.isDevice ? ANDROID_EMULATOR_HOST : devMachineHost();
  if (!host) return raw.replace(/\/$/, '');
  return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}`;
}

export const API_URL = resolveApiUrl(env.apiUrl);

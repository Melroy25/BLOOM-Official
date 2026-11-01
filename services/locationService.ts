/**
 * locationService.ts
 * Real-time GPS location tracking and reverse geocoding for student emergency SOS signal.
 * 
 * Safely requests location permissions on app startup, fetches real coordinates,
 * resolves physical address/landmark, and caches the result for emergency dispatch.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  addressLabel: string;
  mapsUrl: string;
}

const STORAGE_KEY = '@bloom_last_known_location';

// ─── Safe dynamic expo-location loader ────────────────────────────────────────
type ExpoLocationModule = typeof import('expo-location');
let LocationMod: ExpoLocationModule | null = null;

function getLocationModule(): ExpoLocationModule | null {
  if (LocationMod) return LocationMod;
  try {
    LocationMod = require('expo-location') as ExpoLocationModule;
    return LocationMod;
  } catch (err) {
    console.warn('[locationService] expo-location failed to load:', err);
    return null;
  }
}

// ─── Real-time update listeners ──────────────────────────────────────────────
type LocationListener = (loc: UserLocation) => void;
const listeners = new Set<LocationListener>();

export function subscribeToLocation(listener: LocationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(loc: UserLocation) {
  listeners.forEach((l) => {
    try {
      l(loc);
    } catch {}
  });
}

// ─── Format helper ────────────────────────────────────────────────────────────
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `Lat: ${Math.abs(lat).toFixed(4)}° ${latDir}, Long: ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

export function buildGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

// ─── Reverse geocode helper ───────────────────────────────────────────────────
async function resolveAddress(
  Location: ExpoLocationModule,
  lat: number,
  lon: number
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });
    if (results && results.length > 0) {
      const item = results[0];
      const parts = [
        item.name || item.street,
        item.district || item.subregion || (item as any).neighborhood,
        item.city,
        item.region,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (e) {
    // Geocode service might be unavailable offline
  }
  return 'Current Location';
}

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestLocationPermission(): Promise<boolean> {
  const Location = getLocationModule();
  if (!Location) return false;
  try {
    const { status: existing } = await Location.getForegroundPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[locationService] Error requesting permission:', err);
    return false;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  const Location = getLocationModule();
  if (!Location) return false;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Fetch real GPS position ──────────────────────────────────────────────────
export async function getCurrentLocation(highAccuracy = false): Promise<UserLocation | null> {
  const Location = getLocationModule();
  if (!Location) return null;

  try {
    const hasPerm = await requestLocationPermission();
    if (!hasPerm) {
      return getStoredLocation();
    }

    // Try high accuracy with a 10s fallback
    let position;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy
          ? Location.Accuracy.Highest
          : Location.Accuracy.Balanced,
      });
    } catch {
      // Fallback to last known position if active GPS timed out
      position = await Location.getLastKnownPositionAsync();
    }

    if (!position || !position.coords) {
      return getStoredLocation();
    }

    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const addressLabel = await resolveAddress(Location, latitude, longitude);
    const mapsUrl = buildGoogleMapsUrl(latitude, longitude);

    const userLoc: UserLocation = {
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      altitude: altitude ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
      timestamp: position.timestamp,
      addressLabel,
      mapsUrl,
    };

    // Cache locally
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userLoc));
    notifyListeners(userLoc);

    return userLoc;
  } catch (err) {
    console.warn('[locationService] Failed to fetch current location:', err);
    return getStoredLocation();
  }
}

// ─── Cached / Fallback location ───────────────────────────────────────────────
export async function getStoredLocation(): Promise<UserLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserLocation;
  } catch {
    return null;
  }
}

// ─── Initialize on App Startup ────────────────────────────────────────────────
/**
 * Call in root _layout.tsx on app mount.
 * Prompts user for location permission immediately, then fetches real location if granted.
 */
export async function initLocationOnAppOpen(): Promise<UserLocation | null> {
  try {
    const granted = await requestLocationPermission();
    if (granted) {
      return await getCurrentLocation(false);
    }
  } catch (err) {
    console.warn('[locationService] App startup location init error:', err);
  }
  return null;
}

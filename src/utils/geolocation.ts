export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

/**
 * Capture GPS location using browser Geolocation API
 * @param timeout - Maximum time to wait for GPS lock in milliseconds (default: 30000)
 * @returns Promise with GPS coordinates or error
 */
export const captureGPSLocation = (
  timeout: number = 30000
): Promise<GPSLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'UNKNOWN',
        message: 'Geolocation is not supported by your browser',
      } as GeolocationError);
      return;
    }

    const timeoutId = setTimeout(() => {
      reject({
        code: 'TIMEOUT',
        message: 'GPS acquisition timed out. Please try again.',
      } as GeolocationError);
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        let code: GeolocationError['code'] = 'UNKNOWN';
        let message = 'Unknown error acquiring GPS location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            message =
              'GPS permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            message =
              'GPS position unavailable. Try moving to an open area or checking your GPS settings.';
            break;
          case error.TIMEOUT:
            code = 'TIMEOUT';
            message =
              'GPS acquisition timed out. Please try again in an open area.';
            break;
        }

        reject({
          code,
          message,
        } as GeolocationError);
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Format accuracy for display
 * @param accuracy - Accuracy in meters
 * @returns Formatted string
 */
export const formatAccuracy = (accuracy: number): string => {
  if (accuracy < 1) return '< 1m';
  if (accuracy < 10) return `${Math.round(accuracy)}m`;
  if (accuracy < 100) return `${Math.round(accuracy / 5) * 5}m`;
  return `${Math.round(accuracy / 10) * 10}m`;
};

/**
 * Check if accuracy is good enough
 * @param accuracy - Accuracy in meters
 * @returns True if accuracy is acceptable (< 50m)
 */
export const isAccuracyGood = (accuracy: number): boolean => {
  return accuracy < 50;
};

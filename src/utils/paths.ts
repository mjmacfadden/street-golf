/**
 * Get the correct image path for the current environment
 * Handles both local development and GitHub Pages deployment
 */
export const getImagePath = (path: string): string => {
  const baseUrl = import.meta.env.BASE_URL;
  if (path.startsWith('http')) return path; // External URLs
  if (path.startsWith('/')) {
    return baseUrl + path.substring(1); // Remove leading / and add base
  }
  return baseUrl + path;
};

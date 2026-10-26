const FAVORITES_STORAGE_KEY = 'm3u_file_user_favorites';

/**
 * Retrieves list of starred/favorited channel IDs or URLs from localStorage.
 */
export function getSavedFavorites(): Set<string> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return new Set();
  }
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error('Failed to parse favorites:', err);
    return new Set();
  }
}

/**
 * Toggles a channel favorite status in localStorage.
 */
export function toggleFavoriteInStorage(channelIdentifier: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  const favs = getSavedFavorites();
  let isNowFav = false;
  if (favs.has(channelIdentifier)) {
    favs.delete(channelIdentifier);
    isNowFav = false;
  } else {
    favs.add(channelIdentifier);
    isNowFav = true;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favs)));
  } catch (err) {
    console.error('Failed to save favorite:', err);
  }
  return isNowFav;
}

/**
 * Checks if a channel is favorited.
 */
export function isChannelFavorited(channelIdentifier: string, favsSet: Set<string>): boolean {
  return favsSet.has(channelIdentifier);
}

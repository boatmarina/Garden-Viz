/**
 * Plant Image Fetcher - Fetches plant images from Wikipedia and Wikimedia Commons
 */
const ImageFetcher = (() => {
  // Cache to avoid re-fetching
  const cache = new Map();

  /**
   * Fetch images for a plant name.
   * Returns an array of image URLs (close-up and full plant views).
   * @param {string} plantName - Common or botanical name
   * @returns {Promise<{closeup: string[], full: string[]}>}
   */
  async function fetchImages(plantName) {
    if (!plantName) return { closeup: [], full: [] };

    const cacheKey = plantName.toLowerCase().trim();
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = { closeup: [], full: [] };

    try {
      // Try Wikipedia first for the main image
      const wikiImages = await fetchFromWikipedia(plantName);
      if (wikiImages.length > 0) {
        result.full.push(...wikiImages);
      }

      // Then try Wikimedia Commons for more variety
      const commonsImages = await fetchFromCommons(plantName);

      // Categorize images (heuristic based on common naming patterns)
      commonsImages.forEach(img => {
        const lower = img.toLowerCase();
        if (lower.includes('flower') || lower.includes('bloom') || lower.includes('detail') || lower.includes('close')) {
          result.closeup.push(img);
        } else {
          result.full.push(img);
        }
      });

      // Ensure we have at least some images in each category
      if (result.closeup.length === 0 && result.full.length > 1) {
        result.closeup.push(result.full.pop());
      }
      if (result.full.length === 0 && result.closeup.length > 1) {
        result.full.push(result.closeup.pop());
      }

      // Limit to reasonable numbers
      result.closeup = result.closeup.slice(0, 3);
      result.full = result.full.slice(0, 3);

    } catch (err) {
      console.warn('Image fetch error:', err);
    }

    cache.set(cacheKey, result);
    return result;
  }

  /**
   * Fetch main image from Wikipedia article
   */
  async function fetchFromWikipedia(plantName) {
    const images = [];

    try {
      // Search for the Wikipedia article
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(plantName)}`;
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        if (data.thumbnail && data.thumbnail.source) {
          // Get higher resolution version
          const thumbUrl = data.thumbnail.source;
          const highResUrl = thumbUrl.replace(/\/\d+px-/, '/800px-');
          images.push(highResUrl);
        }
        if (data.originalimage && data.originalimage.source) {
          images.push(data.originalimage.source);
        }
      }
    } catch (err) {
      console.warn('Wikipedia fetch error:', err);
    }

    return images;
  }

  /**
   * Fetch images from Wikimedia Commons
   */
  async function fetchFromCommons(plantName) {
    const images = [];

    try {
      // Search Commons for plant images
      const searchTerms = [plantName, `${plantName} plant`, `${plantName} flower`];

      for (const term of searchTerms) {
        if (images.length >= 6) break;

        const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
          `action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}` +
          `&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=800`;

        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data = await response.json();
        if (!data.query || !data.query.pages) continue;

        Object.values(data.query.pages).forEach(page => {
          if (page.imageinfo && page.imageinfo[0]) {
            const url = page.imageinfo[0].thumburl || page.imageinfo[0].url;
            if (url && !images.includes(url)) {
              // Filter out non-plant images (icons, maps, etc.)
              const title = (page.title || '').toLowerCase();
              if (!title.includes('icon') && !title.includes('map') && !title.includes('logo') && !title.includes('flag')) {
                images.push(url);
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn('Commons fetch error:', err);
    }

    return images;
  }

  /**
   * Clear the cache
   */
  function clearCache() {
    cache.clear();
  }

  return { fetchImages, clearCache };
})();

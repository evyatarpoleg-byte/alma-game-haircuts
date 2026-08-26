const KEY = 'almaSalonGallery';

export function loadGallery() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveEntry(entry) {
  const gallery = loadGallery();
  gallery.unshift(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(gallery));
  } catch (e) {
    // storage full or unavailable - fail silently, gameplay still works
  }
  return gallery;
}

export function deleteEntry(id) {
  const gallery = loadGallery().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(gallery));
  } catch (e) {
    // ignore
  }
  return gallery;
}

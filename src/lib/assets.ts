/** Resolve a bundled public asset under Vite's deployment base path. */
export function assetUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

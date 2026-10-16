const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3100/api/v1").replace(/\/$/, "")

export class PortoServiceError extends Error {
  constructor(public readonly status: number, path: string) {
    super(`Porto service returned ${status} for ${path}`)
  }
}

export function websiteUrl(value?: string): URL | null {
  if (!value || !/^https?:\/\//i.test(value)) return null
  try { return new URL(value) } catch { return null }
}

export function assetUrl(value: string): string {
  if (!value.startsWith("/api/v1/uploads/") && value !== "/api/v1/settings/cv") return value
  return `${new URL(apiBase).origin}${value}`
}

export async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { cache: "no-store" })
  if (!response.ok) throw new PortoServiceError(response.status, path)
  return await response.json() as T
}

export const fetchContent = <T>(page: string) => fetchApi<T>(`/content/${page}`)


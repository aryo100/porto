import { assetUrl, fetchApi } from "@/lib/porto-service"
import type { SettingsData } from "@/lib/portfolio-types"

export const revalidate = 3600

async function portrait(head = false) {
  const settings = await fetchApi<SettingsData>("/settings")
  const avatar = settings.profile?.avatar
  const name = avatar?.match(/^\/api\/v1\/uploads\/((?:[0-9]{13}-[a-f0-9]{12}\.(?:png|jpg|jpeg|gif|webp|avif))|voyager-portrait\.jpg)$/)?.[1]
  if (!name) return new Response('Profile photo unavailable', { status: 404 })
  const response = await fetch(assetUrl(`/api/v1/uploads/${name}`), { cache: "force-cache", next: { revalidate: 3600 } })
  if (!response.ok) return new Response("Portrait unavailable", { status: 502 })
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif" }
  return new Response(head ? null : response.body, { headers: { "Content-Type": types[name.split(".").pop()!], "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" } })
}

export const GET = () => portrait()
export const HEAD = () => portrait(true)

import { assetUrl, fetchApi } from "@/lib/porto-service"
import type { SettingsData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

async function portrait(request: Request, head = false) {
  const settings = await fetchApi<SettingsData>("/settings")
  const avatar = settings.profile?.avatar
  const name = avatar?.match(/^\/api\/v1\/uploads\/((?:[0-9]{13}-[a-f0-9]{12}\.(?:png|jpg|jpeg|gif|webp|avif))|voyager-portrait\.jpg)$/)?.[1]
  if (!name) return new Response('Profile photo unavailable', { status: 404 })
  const response = await fetch(assetUrl(`/api/v1/uploads/${name}`), { cache: "no-store" })
  if (!response.ok) return new Response("Portrait unavailable", { status: 502 })
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif" }
  return new Response(head ? null : response.body, { headers: { "Content-Type": types[name.split(".").pop()!], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
}

export const GET = (request: Request) => portrait(request)
export const HEAD = (request: Request) => portrait(request, true)

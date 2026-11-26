import { assetUrl } from "@/lib/porto-service"

export const revalidate = 3600

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!name || !(/^[0-9]{13}-[a-f0-9]{12}\.(?:png|jpg|jpeg|gif|webp|svg|avif)$/.test(name) || /^seed-project-(?:porto(?:-mobile)?|control(?:-mobile)?|service)\.(?:jpg|svg)$/.test(name) || /^seed-project-gallery-(?:fade|slide)-[12]\.svg$/.test(name))) return new Response("Invalid image", { status: 400 })
  const response = await fetch(assetUrl(`/api/v1/uploads/${name}`), { cache: "force-cache", next: { revalidate: 3600 } })
  if (!response.ok) return new Response("Image unavailable", { status: 502 })
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif" }
  return new Response(response.body, { headers: { "Content-Type": types[name.split(".").pop()!], "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" } })
}

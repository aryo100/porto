import { assetUrl } from "@/lib/porto-service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")
  if (!name || !(/^[0-9]{13}-[a-f0-9]{12}\.(?:png|jpg|jpeg|gif|webp|svg|avif)$/.test(name) || /^seed-project-(?:porto(?:-mobile)?|control(?:-mobile)?|service)\.(?:jpg|svg)$/.test(name))) return new Response("Invalid image", { status: 400 })
  const response = await fetch(assetUrl(`/api/v1/uploads/${name}`), { cache: "no-store" })
  if (!response.ok) return new Response("Image unavailable", { status: 502 })
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif" }
  return new Response(response.body, { headers: { "Content-Type": types[name.split(".").pop()!], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
}

import { assetUrl } from "@/lib/porto-service"

export const revalidate = 3600

export async function GET() {
  const response = await fetch(assetUrl("/api/v1/settings/cv"), { cache: "force-cache", next: { revalidate: 3600 } })
  if (!response.ok) return new Response("CV unavailable", { status: 502 })
  return new Response(response.body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=\"CV.pdf\"", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } })
}

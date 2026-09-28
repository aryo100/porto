import { Loader2Icon } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2Icon className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
      <p className="text-lg font-medium text-muted-foreground">Loading...</p>
    </div>
  )
}

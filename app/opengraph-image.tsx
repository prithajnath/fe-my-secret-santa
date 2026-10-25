import { OG_SIZE, renderPreviewCard } from "@/lib/og"

export const alt = "My Secret Santa: organize your Secret Santa exchange"
export const size = OG_SIZE
export const contentType = "image/png"

export default function Image() {
  return renderPreviewCard({
    title: "Organize your Secret Santa exchange",
    subtitle: "Private groups · Anonymous messages · Gift hints",
  })
}

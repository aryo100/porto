export type BlogEntry =
  | {
      type: "internal"
      title: string
      slug: string
      date: string
      description: string
      content: string[]
    }
  | {
      type: "external"
      title: string
      url: string
      date: string
      description: string
      source?: string
    }
  | {
      type: "achievement"
      title: string
      url: string
      date: string
      description: string
    }

export type BlogData = {
  apiName: string
  intro: {
    headline: string
    description: string
  }
  entries: BlogEntry[]
}

export type InternalEntry = Extract<BlogEntry, { type: "internal" }>

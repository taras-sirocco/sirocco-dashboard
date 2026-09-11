export type QueuedBody =
  | { format: 'json'; json: unknown }
  | {
      format: 'form'
      fields: Record<string, string>
      file?: { blob: Blob; fieldName: string; fileName: string }
    }

export type QueueEntry = {
  id: number
  url: string
  /** Людський тег дії — лише для логів/дебагу, сервер його не бачить. */
  kind: string
  body: QueuedBody
  createdAt: number
}

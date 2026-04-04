export const PROTECTED_INTERNAL_COLUMNS = [
  "_id",
  "_rev",
  "type",
  "createdAt",
  "updatedAt",
  "tableId",
] as const

const PROTECTED_INTERNAL_SET: ReadonlySet<string> = new Set(
  (PROTECTED_INTERNAL_COLUMNS as readonly string[])
)

export const PROTECTED_EXTERNAL_COLUMNS = ["_id", "_rev", "tableId"] as const

export function isInternalColumnName(name: string): boolean {
  return PROTECTED_INTERNAL_SET.has(name)
}

export function isExternalColumnName(name: string): boolean {
  return (PROTECTED_EXTERNAL_COLUMNS as readonly string[]).includes(name)
}

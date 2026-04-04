import { FieldType, Table } from "@budibase/types"
import { PROTECTED_INTERNAL_COLUMNS } from "./constants"

const allowDisplayColumnByType: Record<FieldType, boolean> = {
  [FieldType.STRING]: true,
  [FieldType.LONGFORM]: true,
  [FieldType.OPTIONS]: true,
  [FieldType.NUMBER]: true,
  [FieldType.DATETIME]: true,
  [FieldType.FORMULA]: true,
  [FieldType.AI]: true,
  [FieldType.AUTO]: true,
  [FieldType.INTERNAL]: true,
  [FieldType.BARCODEQR]: true,
  [FieldType.BIGINT]: true,

  [FieldType.BOOLEAN]: false,
  [FieldType.ARRAY]: false,
  [FieldType.ATTACHMENTS]: false,
  [FieldType.ATTACHMENT_SINGLE]: false,
  [FieldType.SIGNATURE_SINGLE]: false,
  [FieldType.LINK]: false,
  [FieldType.JSON]: false,
  [FieldType.BB_REFERENCE]: false,
  [FieldType.BB_REFERENCE_SINGLE]: false,
}

const allowSortColumnByType: Record<FieldType, boolean> = {
  [FieldType.STRING]: true,
  [FieldType.LONGFORM]: true,
  [FieldType.OPTIONS]: true,
  [FieldType.NUMBER]: true,
  [FieldType.DATETIME]: true,
  [FieldType.AUTO]: true,
  [FieldType.INTERNAL]: true,
  [FieldType.BARCODEQR]: true,
  [FieldType.BIGINT]: true,
  [FieldType.BOOLEAN]: true,
  [FieldType.JSON]: false,

  [FieldType.FORMULA]: false,
  [FieldType.AI]: false,
  [FieldType.ATTACHMENTS]: false,
  [FieldType.ATTACHMENT_SINGLE]: false,
  [FieldType.SIGNATURE_SINGLE]: false,
  [FieldType.ARRAY]: false,
  [FieldType.LINK]: false,
  [FieldType.BB_REFERENCE]: false,
  [FieldType.BB_REFERENCE_SINGLE]: false,
}

const allowDefaultColumnByType: Record<FieldType, boolean> = {
  [FieldType.NUMBER]: true,
  [FieldType.JSON]: true,
  [FieldType.DATETIME]: true,
  [FieldType.LONGFORM]: true,
  [FieldType.STRING]: true,
  [FieldType.OPTIONS]: true,
  [FieldType.ARRAY]: true,
  [FieldType.BIGINT]: true,
  [FieldType.BOOLEAN]: true,

  [FieldType.AUTO]: false,
  [FieldType.INTERNAL]: false,
  [FieldType.BARCODEQR]: false,
  [FieldType.FORMULA]: false,
  [FieldType.AI]: false,
  [FieldType.ATTACHMENTS]: false,
  [FieldType.ATTACHMENT_SINGLE]: false,
  [FieldType.SIGNATURE_SINGLE]: false,
  [FieldType.LINK]: false,
  [FieldType.BB_REFERENCE]: true,
  [FieldType.BB_REFERENCE_SINGLE]: true,
}

export function canBeDisplayColumn(type: FieldType): boolean {
  return !!allowDisplayColumnByType[type]
}

export function canBeSortColumn(type: FieldType): boolean {
  return !!allowSortColumnByType[type]
}

export function canHaveDefaultColumn(type: FieldType): boolean {
  return !!allowDefaultColumnByType[type]
}

export function isAllowedDisplayField(name: string, type: FieldType) {
  if (PROTECTED_INTERNAL_COLUMNS.includes(name as any)) return false
  return canBeDisplayColumn(type)
}

export function findDuplicateInternalColumns(table: Table): string[] {
  // maintains the case of keys
  const casedKeys = Object.keys(table.schema)
  // Count occurrences of lower-cased keys in one pass
  const counts = new Map<string, number>()
  for (let i = 0, len = casedKeys.length; i < len; i++) {
    const lower = casedKeys[i].toLowerCase()
    counts.set(lower, (counts.get(lower) || 0) + 1)
  }

  const duplicates: string[] = []
  // collect keys that appear more than once (preserving insertion order of first appearance)
  for (const [key, count] of counts) {
    if (count > 1) duplicates.push(key)
  }

  // fast lookup for exact-case internal column matches
  const casedSet = new Set(casedKeys)
  for (let i = 0, len = PROTECTED_INTERNAL_COLUMNS.length; i < len; i++) {
    const internalColumn = PROTECTED_INTERNAL_COLUMNS[i]
    if (casedSet.has(internalColumn)) {
      duplicates.push(internalColumn)
    }
  }
  return duplicates
}

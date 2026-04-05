import {
  BBReferenceFieldSubType,
  FieldConstraints,
  FieldSchema,
  FieldType,
} from "@budibase/types"

const BYTE_HEX: string[] = (() => {
  const table: string[] = new Array(256)
  for (let i = 0; i < 256; i++) {
    const s = i.toString(16)
    table[i] = s.length === 1 ? "0" + s : s
  }
  return table
})()

export function isDeprecatedSingleUserColumn(
  schema: Pick<FieldSchema, "type" | "subtype" | "constraints">
): schema is {
  type: FieldType.BB_REFERENCE
  subtype: BBReferenceFieldSubType.USER
} {
  const result =
    schema.type === FieldType.BB_REFERENCE &&
    schema.subtype === BBReferenceFieldSubType.USER &&
    schema.constraints?.type !== "array"
  return result
}

export function isRequired(constraints: FieldConstraints | undefined) {
  const isRequired =
    !!constraints &&
    ((typeof constraints.presence !== "boolean" &&
      constraints.presence?.allowEmpty === false) ||
      constraints.presence === true)
  return isRequired
}

// SQS does not support non-ASCII characters in column names, so we need to
// replace them with unicode escape sequences.
export function encodeNonAscii(str: string): string {
  // Fast-path for empty strings
  if (str.length === 0) return str

  const len = str.length
  const out: string[] = new Array(len)
  let outLen = 0

  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i)
    if (code > 127) {
      const hi = (code >> 8) & 0xff
      const lo = code & 0xff
      out[outLen++] = "\\u" + BYTE_HEX[hi] + BYTE_HEX[lo]
    } else {
      out[outLen++] = str.charAt(i)
    }
  }

  // If no non-ascii chars were encountered, joining still returns the same string
  return out.join("")
}

export function decodeNonAscii(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  )
}

export function isNumeric(field: FieldSchema) {
  return field.type === FieldType.NUMBER || field.type === FieldType.BIGINT
}

import {
  BBReferenceFieldSubType,
  FieldConstraints,
  FieldSchema,
  FieldType,
} from "@budibase/types"

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
  return str
    .split("")
    .map(char => {
      return char.charCodeAt(0) > 127
        ? "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0")
        : char
    })
    .join("")
}

export function decodeNonAscii(str: string): string {
  const len: number = str.length
  let i: number = 0
  let last: number = 0
  let out: string[] | null = null

  while (i < len) {
    // look for backslash followed by 'u' and four hex digits: \uXXXX
    if (str.charCodeAt(i) === 92 /* '\' */ && i + 5 < len && str.charCodeAt(i + 1) === 117 /* 'u' */) {
      let val: number = 0
      let ok: boolean = true
      // parse 4 hex digits
      for (let j = i + 2; j < i + 6; j++) {
        const cc: number = str.charCodeAt(j)
        let digit: number
        if (cc >= 48 && cc <= 57) {
          digit = cc - 48 // '0'-'9'
        } else if (cc >= 65 && cc <= 70) {
          digit = cc - 55 // 'A'-'F' -> 10-15
        } else if (cc >= 97 && cc <= 102) {
          digit = cc - 87 // 'a'-'f' -> 10-15
        } else {
          ok = false
          break
        }
        val = (val << 4) | digit
      }

      if (ok) {
        // lazy initialize output pieces only when a replacement is needed
        if (out === null) out = []
        if (last < i) out.push(str.slice(last, i))
        out.push(String.fromCharCode(val))
        i += 6
        last = i
        continue
      }
    }
    i++
  }

  // if no replacements were made, return original string (fast path)
  if (out === null) return str
  if (last < len) out.push(str.slice(last))
  return out.join("")
}

export function isNumeric(field: FieldSchema) {
  return field.type === FieldType.NUMBER || field.type === FieldType.BIGINT
}

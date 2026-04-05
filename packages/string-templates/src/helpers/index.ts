import Helper from "./Helper"
import Handlebars from "handlebars"
import * as externalHandlebars from "./external"
import { processJS } from "./javascript"
import {
  HelperFunctionNames,
  HelperFunctionBuiltin,
  LITERAL_MARKER,
} from "./constants"

const cachedHelperFunctionBuiltin = HelperFunctionBuiltin

const cachedHelperFunctionNames = Object.values(HelperFunctionNames)

export { getJsHelperList } from "./list"

const HTML_SWAPS = {
  "<": "&lt;",
  ">": "&gt;",
}

function isObject(value: string | any[]) {
  if (value == null || typeof value !== "object") {
    return false
  }
  return (
    value.toString() === "[object Object]" ||
    (value.length > 0 && typeof value[0] === "object")
  )
}

export const HELPERS = [
  // external helpers
  new Helper(HelperFunctionNames.OBJECT, (value: any) => {
    return new Handlebars.SafeString(JSON.stringify(value))
  }),
  // javascript helper
  new Helper(HelperFunctionNames.JS, processJS, false),
  new Helper(HelperFunctionNames.DECODE_ID, (_id: string | { _id: string }) => {
    if (!_id) {
      return []
    }
    // have to replace on the way back as we swapped out the double quotes
    // when encoding, but JSON can't handle the single quotes
    const id = typeof _id === "string" ? _id : _id._id
    const decoded: string = decodeURIComponent(id).replace(/'/g, '"')
    try {
      const parsed = JSON.parse(decoded)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (err) {
      // wasn't json - likely was handlebars for a many to many
      return [_id]
    }
  }),
  // this help is applied to all statements
  new Helper(
    HelperFunctionNames.ALL,
    (value: string, inputs: { __opts: any }) => {
      const { __opts } = inputs
      if (isObject(value)) {
        return new Handlebars.SafeString(JSON.stringify(value))
      }
      // null/undefined values produce bad results
      if (__opts && __opts.onlyFound && value == null) {
        return __opts.input
      }
      if (value == null || typeof value !== "string") {
        return value == null ? "" : value
      }
      // TODO: check, this should always be false
      if (value && (value as any).string) {
        value = (value as any).string
      }
      let text: any = value
      if (__opts && __opts.escapeNewlines) {
        text = value.replace(/\n/g, "\\n")
      }
      text = new Handlebars.SafeString(text.replace(/&amp;/g, "&"))
      if (text == null || typeof text !== "string") {
        return text
      }
      return text.replace(/[<>]/g, (tag: string) => {
        return HTML_SWAPS[tag as keyof typeof HTML_SWAPS] || tag
      })
    }
  ),
  // adds a note for post-processor
  new Helper(HelperFunctionNames.LITERAL, (value: any) => {
    if (value === undefined) {
      return ""
    }
    const type = typeof value
    const outputVal = type === "object" ? JSON.stringify(value) : value
    return `{{${LITERAL_MARKER} ${type}-${outputVal}}}`
  }),
]

export function HelperNames() {
  // Read external helpers each call to preserve dynamic updates to that source
  const external = externalHandlebars.externalHelperNames

  // Compute resulting length respecting concat semantics:
  // - if an item is an array, its elements are appended
  // - otherwise the item itself is appended as a single element
  let totalLen = cachedHelperFunctionNames.length
  if (Array.isArray(cachedHelperFunctionBuiltin)) {
    totalLen += cachedHelperFunctionBuiltin.length
  } else {
    totalLen += 1
  }
  if (Array.isArray(external)) {
    totalLen += external.length
  } else {
    totalLen += 1
  }

  const result = new Array(totalLen)
  let i = 0

  // Copy cached helper function names
  for (let j = 0, jl = cachedHelperFunctionNames.length; j < jl; j++, i++) {
    result[i] = cachedHelperFunctionNames[j]
  }

  // Copy builtin (array or single)
  if (Array.isArray(cachedHelperFunctionBuiltin)) {
    for (let j = 0, jl = cachedHelperFunctionBuiltin.length; j < jl; j++, i++) {
      result[i] = cachedHelperFunctionBuiltin[j]
    }
  } else {
    result[i++] = cachedHelperFunctionBuiltin as any
  }

  // Copy external helpers (array or single)
  if (Array.isArray(external)) {
    for (let j = 0, jl = external.length; j < jl; j++, i++) {
      result[i] = external[j]
    }
  } else {
    result[i++] = external as any
  }

  return result
}

export function registerMinimum(handlebars: typeof Handlebars) {
  for (let helper of HELPERS) {
    helper.register(handlebars)
  }
}

export function registerAll(handlebars: typeof Handlebars) {
  registerMinimum(handlebars)
  // register imported helpers
  externalHandlebars.registerAll(handlebars)
}

export function unregisterAll(handlebars: any) {
  for (let helper of HELPERS) {
    helper.unregister(handlebars)
  }
  // unregister all imported helpers
  externalHandlebars.unregisterAll(handlebars)
}

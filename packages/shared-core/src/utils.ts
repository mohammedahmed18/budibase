import {
  LegacyFilter,
  UISearchFilter,
  UILogicalOperator,
  SearchFilters,
  BasicOperator,
  ArrayOperator,
  isLogicalSearchOperator,
  SearchFilter,
  EmptyFilterOption,
} from "@budibase/types"
import * as Constants from "./constants"
import { removeKeyNumbering, splitFiltersArray } from "./filters"
import pick from "lodash/pick"

const allowed: Map<string, string> = new Map([
  [BasicOperator.STRING as unknown as string, "email"],
  [BasicOperator.FUZZY as unknown as string, "email"],
  [BasicOperator.EQUAL as unknown as string, "_id"],
  [ArrayOperator.ONE_OF as unknown as string, "_id"],
])

const FILTER_ALLOWED_KEYS: (keyof SearchFilter)[] = [
  "field",
  "operator",
  "value",
  "type",
  "externalType",
  "valueType",
  "noValue",
  "formulaType",
]

export function unreachable(
  value: never,
  opts?: {
    message?: string
    doNotThrow?: boolean
  }
) {
  const message = opts?.message || `No such case in exhaustive switch: ${value}`
  const doNotThrow = !!opts?.doNotThrow
  if (!doNotThrow) {
    throw new Error(message)
  }
}

export async function parallelForeach<T>(
  items: Iterable<T> | AsyncIterable<T>,
  task: (item: T) => Promise<void>,
  maxConcurrency: number
): Promise<void> {
  const results: Promise<void>[] = []

  // Check if it's an async iterable
  const isAsyncIterable = Symbol.asyncIterator in items
  const iterator = isAsyncIterable
    ? (items as AsyncIterable<T>)[Symbol.asyncIterator]()
    : (items as Iterable<T>)[Symbol.iterator]()

  const executeNext = async (): Promise<void> => {
    let result = await (isAsyncIterable
      ? (iterator as AsyncIterator<T>).next()
      : Promise.resolve((iterator as Iterator<T>).next()))

    while (!result.done) {
      await task(result.value)
      result = await (isAsyncIterable
        ? (iterator as AsyncIterator<T>).next()
        : Promise.resolve((iterator as Iterator<T>).next()))
    }
  }

  for (let i = 0; i < maxConcurrency; i++) {
    results.push(executeNext())
  }

  // Wait for all workers to complete, this will throw if any task failed
  await Promise.all(results)
}

export function filterValueToLabel() {
  return Object.keys(Constants.OperatorOptions).reduce(
    (acc: { [key: string]: string }, key: string) => {
      const ops: { [key: string]: any } = Constants.OperatorOptions
      const op: { [key: string]: string } = ops[key]
      acc[op["value"]] = op.label
      return acc
    },
    {}
  )
}

export function hasSchema(test: any) {
  return (
    typeof test === "object" &&
    !Array.isArray(test) &&
    test !== null &&
    !(test instanceof Date) &&
    Object.keys(test).length > 0
  )
}

export function trimOtherProps(object: any, allowedProps: string[]) {
  const result = Object.keys(object)
    .filter(key => allowedProps.includes(key))
    .reduce<Record<string, any>>(
      (acc, key) => ({ ...acc, [key]: object[key] }),
      {}
    )
  return result
}

export function isSupportedUserSearch(
  query: SearchFilters
): query is SearchFilters {
  // Iterate over own properties directly to avoid creating a shallow copy via destructuring
  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) {
      continue
    }
    if (key === "allOr" || key === "onEmptyFilter") {
      continue
    }

    const operation = (query as any)[key]

    if (typeof operation !== "object") {
      return false
    }

    if (isLogicalSearchOperator(key)) {
      const conditions = (operation as any).conditions
      for (let i = 0, len = conditions.length; i < len; i++) {
        if (!isSupportedUserSearch(conditions[i])) {
          return false
        }
      }
      return true
    }

    // Determine whether the operation object has zero, one, or more than one own property
    let firstField: string | null = null
    let fieldCount = 0
    const op = operation || {}
    for (const f in op) {
      if (!Object.prototype.hasOwnProperty.call(op, f)) continue
      firstField = f
      if (++fieldCount > 1) break
    }
    // this filter doesn't contain options - ignore
    if (fieldCount === 0) {
      continue
    }

    const expected = allowed.get(key)
    if (!expected || fieldCount !== 1 || firstField !== expected) {
      return false
    }
  }

  return true
}

export function processSearchFilters(
  filterArray?: LegacyFilter[]
): Required<UISearchFilter> | undefined {
  if (!filterArray || filterArray.length === 0) {
    return undefined
  }
  const { allOr, onEmptyFilter, filters } = splitFiltersArray(filterArray)
  return {
    logicalOperator: UILogicalOperator.ALL,
    onEmptyFilter: onEmptyFilter || EmptyFilterOption.RETURN_ALL,
    groups: [
      {
        logicalOperator: allOr ? UILogicalOperator.ANY : UILogicalOperator.ALL,
        filters: filters.map(filter => {
          const trimmedFilter = pick(
            filter,
            FILTER_ALLOWED_KEYS
          ) as SearchFilter
          trimmedFilter.field = removeKeyNumbering(trimmedFilter.field)
          return trimmedFilter
        }),
      },
    ],
  }
}

export function toMap<TKey extends keyof TItem, TItem extends {}>(
  key: TKey,
  list: TItem[]
): Record<string, TItem> {
  return list.reduce<Record<string, TItem>>((result, item) => {
    result[item[key] as string] = item
    return result
  }, {})
}

const resolveWorkspaceName = (name: string) => {
  return name ? name.trim() : null
}

const resolveWorkspaceUrl = (name: string) => {
  let parsedName
  const resolvedName = resolveWorkspaceName(name)
  parsedName = resolvedName ? resolvedName.toLowerCase() : ""
  const parsedUrl = parsedName ? parsedName.replace(/\s+/g, "-") : ""
  return encodeURI(parsedUrl)
}

export const nameToUrl = (workspaceName: string) => {
  let resolvedUrl = resolveWorkspaceUrl(workspaceName)
  return tidyUrl(resolvedUrl)
}

const tidyUrl = (url: string | null) => {
  if (url && !url.startsWith("/")) {
    url = `/${url}`
  }
  return url === "" ? null : url
}

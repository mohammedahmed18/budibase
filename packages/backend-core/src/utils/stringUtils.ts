const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
export function validEmail(value: string) {
  // Preserve original falsy-return behavior
  if (!value) return value

  const anyVal = value as any
  const matchFn = anyVal.match

  // If the value has a callable .match (typical for strings), use test() to avoid allocation
  if (typeof matchFn === "function") {
    return EMAIL_RE.test(value)
  }

  // Preserve original behavior (including thrown TypeError) for truthy values
  // that do not have a callable .match by attempting the original call.
  return !!anyVal.match(EMAIL_RE)
}

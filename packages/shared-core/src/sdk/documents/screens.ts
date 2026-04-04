import { Screen, Component } from "@budibase/types"

export function findInSettings(screen: Screen, toFind: string) {
  const foundIn: { setting: string; value: string }[] = []
  function recurse(props: Component, parentKey = "") {
    const keys = Object.keys(props as Record<string, unknown>)
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const value = (props as Record<string, unknown>)[key]
      if (!value) {
        continue
      }
      if (typeof value === "string" && value.includes(toFind)) {
        foundIn.push({
          setting: parentKey ? `${parentKey}.${key}` : key,
          value: value,
        })
      } else if (typeof value === "object") {
        recurse(value as Component, key)
      }
    }
  }

  recurse(screen.props)
  return foundIn
}

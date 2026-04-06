export function punctuateList(list: string[]) {
  if (list.length === 0) return ""
  if (list.length === 1) return list[0]
  if (list.length === 2) return list[0] + " and " + list[1]

  const len = list.length
  const lastIndex = len - 1
  let result = ""

  // Build string in a single pass to avoid slice/join allocations
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      result += list[i]
    } else if (i === lastIndex) {
      result += " and " + list[i]
    } else {
      result += ", " + list[i]
    }
  }

  return result
}

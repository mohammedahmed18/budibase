import { promisify } from "util"
import zlib from "zlib"

const inFlight: Map<string, Promise<string>> = new Map()

const resultCache: Map<string, string> = new Map()

const MAX_CACHE_SIZE: number = 1000

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export const GZIP_PREFIX = "gzip:"

export const gzipToBase64 = async (input: string): Promise<string> => {
  // Return cached result if present.
  const cached = resultCache.get(input)
  if (cached !== undefined) {
    return cached
  }

  // If there's an in-flight compression for the same input, await and return it.
  const ongoing = inFlight.get(input)
  if (ongoing !== undefined) {
    return await ongoing
  }

  // Create the compression promise, store it as in-flight, and run it.
  const work = (async (): Promise<string> => {
    // Preserve the original awaited gzip call.
    const compressed = await gzip(input)
    const encoded = `${GZIP_PREFIX}${compressed.toString("base64")}`

    // Cache the result with a simple size limit / eviction of the oldest entry.
    resultCache.set(input, encoded)
    if (resultCache.size > MAX_CACHE_SIZE) {
      const firstKey = resultCache.keys().next().value
      if (firstKey !== undefined) {
        resultCache.delete(firstKey)
      }
    }

    return encoded
  })()

  inFlight.set(input, work)

  try {
    const result = await work
    return result
  } finally {
    // Ensure we remove the in-flight marker regardless of success/failure.
    inFlight.delete(input)
  }
}

export const gunzipFromBase64 = async (input: string): Promise<string> => {
  const payload = input.startsWith(GZIP_PREFIX)
    ? input.slice(GZIP_PREFIX.length)
    : input
  const payloadBuffer = Buffer.from(payload, "base64")
  const inflated = await gunzip(new Uint8Array(payloadBuffer))
  return inflated.toString("utf8")
}

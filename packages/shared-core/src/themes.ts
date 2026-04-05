import { ThemeOptions, ThemeClassPrefix } from "./constants/themes"
import { Theme } from "@budibase/types"

const PREFIX_LEN = ThemeClassPrefix.length

const THEME_MAP: Map<string, typeof ThemeOptions[0]> = (() => {
  const m = new Map<string, typeof ThemeOptions[0]>()
  for (let i = 0, len = ThemeOptions.length; i < len; i++) {
    const opt = ThemeOptions[i]
    m.set(opt.id, opt)
  }
  return m
})()

const THEME_IDS = new Set(THEME_MAP.keys())

// Gets the CSS class names for the specified theme
export const getThemeClassNames = (theme?: Theme): string => {
  theme = ensureValidTheme(theme)
  let classNames = `${ThemeClassPrefix}${theme}`

  // Prefix with base class if required
  const base = THEME_MAP.get(theme as string)?.base
  if (base) {
    classNames = `${ThemeClassPrefix}${base} ${classNames}`
  }

  return classNames
}

// Ensures a theme value is a valid option
export const ensureValidTheme = (
  theme?: Theme,
  fallback: Theme = Theme.DARKEST
): Theme => {
  if (!theme) {
    return fallback
  }

  // Ensure we aren't using the spectrum prefix
  if (theme.startsWith(ThemeClassPrefix)) {
    theme = theme.split(ThemeClassPrefix)[1] as Theme
  }

  // Check we aren't using a deprecated theme, and migrate
  // to the nearest valid theme if we are
  if (!ThemeOptions.some(x => x.id === theme)) {
    if (theme === Theme.LIGHTEST) {
      return Theme.LIGHT
    } else if (theme === Theme.DARK) {
      return Theme.DARKEST
    } else {
      return fallback
    }
  }
  return theme
}

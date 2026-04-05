export type TranslationCategory =
  | "userMenu"
  | "profileModal"
  | "passwordModal"
  | "picker"
  | "recaptcha"
  | "portal"
  | "login"
  | "forgotPassword"

export interface TranslationDefinitionInput {
  key: string
  name: string
  defaultValue: string
  fullKey?: string
}

export interface TranslationDefinition
  extends Omit<TranslationDefinitionInput, "fullKey"> {
  category: TranslationCategory
  fullKey: string
}

export type TranslationOverrides = Record<string, string>

/**
 * Converts raw translation definitions into fully-qualified definitions
 * by adding category and resolving `fullKey`. If `fullKey` already exists,
 * it is reused; otherwise, it's generated as `category.key`.
 */
export const createTranslationDefinitions = (
  category: TranslationCategory,
  definitions: ReadonlyArray<TranslationDefinitionInput>
): TranslationDefinition[] => {
  const len = definitions.length
  const result: TranslationDefinition[] = new Array(len)

  for (let i = 0; i < len; i++) {
    const definition = definitions[i]
    const key = definition.key
    const fullKey =
      definition.fullKey ??
      (key.indexOf(".") !== -1 ? key : category + "." + key)

    result[i] = {
      key: definition.key,
      name: definition.name,
      defaultValue: definition.defaultValue,
      category,
      fullKey,
    }
  }

  return result
}

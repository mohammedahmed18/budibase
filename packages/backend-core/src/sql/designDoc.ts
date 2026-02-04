import { PreSaveSQLiteDefinition } from "@budibase/types"
import { SQLITE_DESIGN_DOC_ID } from "../constants"

const BASE_STRUCTURE = {
  _id: SQLITE_DESIGN_DOC_ID,
  language: "sqlite" as const,
} as const

// the table id property defines which property in the document
// to use when splitting the documents into different sqlite tables
export function base(tableIdProp: string): PreSaveSQLiteDefinition {
  // Create object with consistent shape for V8 optimization
  return {
    _id: BASE_STRUCTURE._id,
    language: BASE_STRUCTURE.language,
    sql: {
      tables: {},
      options: {
        table_name: tableIdProp,
      },
    },
  }
}

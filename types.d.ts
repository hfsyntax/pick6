export type screenSizes = {
  small: number
  medium: number
  large: number
}

export type columnSettings = {
  [key: string]: screenSizes
}

export type FormResult = {
  message?: string
  error?: string
}

export type PickResult = {
  picks: QueryResultRow[]
  headers: string[]
}

export type SortFields = "gp" | "group_number" | "rank" | "none"

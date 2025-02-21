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

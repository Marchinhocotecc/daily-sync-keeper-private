export const safeIncludes = (val: string | null | undefined, search: string): boolean => {
  return typeof val === "string" ? val.indexOf(search) !== -1 : false
}

export const safeIndexOf = <T,>(arr: T[] | null | undefined, search: T): number => {
  return Array.isArray(arr) ? arr.indexOf(search) : -1
}

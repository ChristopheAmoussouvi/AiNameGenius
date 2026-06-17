export function normalizeName(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim()
}

export function toDomainSld(input: string) {
  return normalizeName(input)
}

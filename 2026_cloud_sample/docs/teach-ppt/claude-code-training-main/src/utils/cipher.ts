const PREFIX = 'HEX_'
const SUFFIX = '_2025'
const SEPARATOR = '-'

function addSeparators(str: string): string {
  return str.match(/.{1,4}/g)?.join(SEPARATOR) || str
}

function reverseString(str: string): string {
  return str.split('').reverse().join('')
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = String.fromCharCode(...bytes)
  return btoa(binary)
}

export function generatePassword(playerName: string): string {
  const withFixes = PREFIX + playerName + SUFFIX
  const reversed = reverseString(withFixes)
  const base64 = toBase64(reversed)
  return addSeparators(base64)
}

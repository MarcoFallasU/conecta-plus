const HONORIFICS = ['doña', 'don', 'dña', 'dña.']

// "Doña Marta Jiménez" -> "Doña Marta"; "Ana Vargas Rojas" -> "Ana".
export function greetingName(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const hasHonorific = HONORIFICS.includes(words[0].toLowerCase())
  return hasHonorific && words.length > 1 ? `${words[0]} ${words[1]}` : words[0]
}

export function ageFromBirthYear(birthYear: number | null, now = new Date()) {
  return birthYear ? now.getFullYear() - birthYear : null
}

// Solo dígitos y +, para `tel:`.
export function dialable(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

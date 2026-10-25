// Remembers, per browser, which groups' Secret Santas the user has already revealed,
// so the spin only plays once. The identity itself always comes from the API.
const key = (groupId: number) => `revealed-santa:${groupId}`

export function hasRevealedSanta(groupId: number): boolean {
  try {
    return localStorage.getItem(key(groupId)) === "1"
  } catch {
    return false
  }
}

export function markSantaRevealed(groupId: number): void {
  try {
    localStorage.setItem(key(groupId), "1")
  } catch {
    // Storage unavailable (private mode etc.); the spin will just play again next time
  }
}

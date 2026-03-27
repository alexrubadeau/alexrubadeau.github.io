export function createDeck(amount = 1) {
  const suits = ['♠', '♥', '♦', '♣']
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  const deck = []
  for (let i = 0; i < amount; i++) {
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value })
      }
    }
  }

  return deck
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  return deck
}

export function drawCard(deck) {
  if (deck.length === 0) {
    throw new Error('Deck is empty!')
  }
  return deck.pop()
}


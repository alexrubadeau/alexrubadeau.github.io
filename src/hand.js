export function getCardValue(card) {
  if (['J', 'Q', 'K'].includes(card.value)) return 10
  if (card.value === 'A') return 11
  return Number(card.value)
}

export function getHandValue(hand) {
  let total = 0
  let aces = 0

  for (const card of hand) {
    total += getCardValue(card)
    if (card.value === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return total
}

export function isBlackjack(hand) {
  return hand.length === 2 && getHandValue(hand) === 21
}

export function isFiveCardCharlie(hand) {
  return hand.length >= 5 && getHandValue(hand) <= 21
}

export function hasAce(hand) {
  return hand.some(card => card.value === 'A')
}

export function canDouble(hand) {
  const total = getHandValue(hand)
  return hasAce(hand) || (total >= 9 && total <= 11)
}

export function canSplit(hand) {
    return hand.length === 2 && hand[0].value === hand[1].value
}

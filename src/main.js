import './style.css'
import { createDeck, shuffle, drawCard } from './deck.js'
import { getHandValue, isBlackjack, isFiveCardCharlie, canDouble, canSplit } from './hand.js'

const dealerCardsEl = document.getElementById('dealer-cards')
const dealerScoreEl = document.getElementById('dealer-score')
const messageEl = document.getElementById('message')

const startBtn = document.getElementById('start-btn')

const mainMenuBtn = document.getElementById('menu-btn')
const dealBtn = document.getElementById('deal-btn')
const hitBtn = document.getElementById('hit-btn')
const standBtn = document.getElementById('stand-btn')
const doubleBtn = document.getElementById('double-btn')
const splitBtn = document.getElementById('split-btn')
const insuranceBtn = document.getElementById('insurance-btn')

const playerEls = document.querySelectorAll('.player')

let playerCount = 1
let deckCount = 1
let menu = true
let canInsure = false

let resolvingRound = false
let deck = shuffle(createDeck(deckCount))
let dealerHand = []
let currentPlayerIndex = 0

const playersContainer = document.getElementById('players')
let players = []

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getCurrentPlayer() {
  return players[currentPlayerIndex]
}

function isRoundComplete() {
  return currentPlayerIndex >= players.length
}

function getCurrentHand(player) {
  return player.hands[player.activeHandIndex]
}

function allHandsFinished(player) {
  return player.hands.every(hand => hand.stood || hand.busted)
}

async function autoResolveCurrentHand(player) {
  if (!player) return false

  const hand = getCurrentHand(player)
  if (!hand || hand.stood || hand.busted) return false

  const total = getHandValue(hand.cards)

  if (isBlackjack(hand.cards)) {
    hand.stood = true
    messageEl.textContent = `${hand.label} has Blackjack!`
    renderPlayers()
    updateControls(true)
    await sleep(2000)
    updateControls()
    await advanceHandOrTurn(player)
    return true
  }

  if (total === 21) {
    hand.stood = true
    messageEl.textContent = `${hand.label} has 21 and stands.`
    renderPlayers()
    updateControls(true)
    await sleep(2000)
    updateControls()
    await advanceHandOrTurn(player)
    return true
  }

  if (isFiveCardCharlie(hand.cards)) {
    hand.stood = true
    messageEl.textContent = `${hand.label} gets a Five-Card Charlie!`
    renderPlayers()
    updateControls(true)
    await sleep(2000)
    updateControls()
    await advanceHandOrTurn(player)
    return true
  }

  return false
}

function createPlayerElements(count) {
  playersContainer.innerHTML = ''

  for (let i = 0; i < count; i++) {
    const playerEl = document.createElement('div')
    playerEl.classList.add('player')
    playerEl.id = `player-${i + 1}`

    playerEl.innerHTML = `
      <h2>Player ${i + 1}</h2>
      <h3 class="chips">Chips: ${players[i]?.chips || 1000}</h3>
      <label for="bet">Bet (10-1000):</label>
      <input 
        type="number" 
        class="bet" 
        name="bet" 
        min="10" 
        max="1000" 
        value="10"
        step="1" 
        required
      >
      <div class="cards"></div>
    
      <h2 class="score"></h2>
    `

    playersContainer.appendChild(playerEl)
  }
}

function initializePlayers(count) {
  createPlayerElements(count)

  players = []
  for (let i = 0; i < count; i++) {
    const playerEl = document.getElementById(`player-${i + 1}`)
    players.push({
      name: `Player ${i + 1}`,
      el: playerEl,
      cardsEl: playerEl.querySelector('.cards'),
      scoreEl: playerEl.querySelector('.score'),
      chipsEl: playerEl.querySelector('.chips'),
      betEl: playerEl.querySelector('.bet'),
      hands: [],
      activeHandIndex: 0,
      chips: 1000
    })
  }
}

function renderCard(container, card) {
  const cardEl = document.createElement('div')
  cardEl.classList.add('card')

  if (card.suit === '♥' || card.suit === '♦') {
    cardEl.classList.add('red')
  }

  cardEl.textContent = `${card.value}${card.suit}`
  container.appendChild(cardEl)
}

function renderHiddenCard(container) {
  const cardEl = document.createElement('div')
  cardEl.classList.add('card', 'hidden-card')
  container.appendChild(cardEl)
}

function renderDealer(hideSecondCard = true) {
  dealerCardsEl.innerHTML = ''

  if (hideSecondCard) {
    renderCard(dealerCardsEl, dealerHand[0])

    if (dealerHand[1]) {
      renderHiddenCard(dealerCardsEl)
    }

    dealerScoreEl.textContent = `Score: ${getHandValue([dealerHand[0]])}`
    return
  }

  for (const card of dealerHand) {
    renderCard(dealerCardsEl, card)
  }

  dealerScoreEl.textContent = `Score: ${getHandValue(dealerHand)}`
}

function renderPlayers() {
  players.forEach(player => {
    player.cardsEl.innerHTML = ''

    player.hands.forEach((hand, handIndex) => {
      const handEl = document.createElement('div')
      handEl.classList.add('split-hand')

      if (handIndex === player.activeHandIndex && currentPlayerIndex < players.length) {
        handEl.classList.add('active-hand')
      }

      const labelEl = document.createElement('h3')
      labelEl.textContent = hand.label

      const cardsRowEl = document.createElement('div')
      cardsRowEl.classList.add('split-cards-row')

      hand.cards.forEach(card => {
        renderCard(cardsRowEl, card)
      })

      const scoreEl = document.createElement('p')
      scoreEl.textContent = `Score: ${getHandValue(hand.cards)} | Bet: ${hand.bet}`

      handEl.appendChild(labelEl)
      handEl.appendChild(cardsRowEl)
      handEl.appendChild(scoreEl)

      player.cardsEl.appendChild(handEl)
    })

    const activeHand = getCurrentHand(player)
    player.scoreEl.textContent = `Current: ${activeHand.label}`
    player.chipsEl.textContent = `Chips: ${player.chips}`
  })
}

function renderAll() {
  const dealerShouldHideCard = currentPlayerIndex < players.length
  renderDealer(dealerShouldHideCard)
  renderPlayers()
}

function updateControls(disabled = false) {
  const roundActive = currentPlayerIndex < players.length && !resolvingRound
  const currentPlayer = getCurrentPlayer()
  const currentHand = currentPlayer ? getCurrentHand(currentPlayer) : null
  const roundComplete = isRoundComplete()

  dealBtn.disabled = disabled || !roundComplete || resolvingRound || menu || players.length === 0

  hitBtn.disabled = disabled || !roundActive
  standBtn.disabled = disabled || !roundActive
  doubleBtn.disabled = disabled || !roundActive || !currentHand || !canDouble(currentHand.cards)
  splitBtn.disabled = disabled || !roundActive || !currentHand || !canSplit(currentHand.cards)

  insuranceBtn.disabled = disabled || !canInsure || resolvingRound
}

async function advanceTurn() {
  currentPlayerIndex++

  while (
    currentPlayerIndex < players.length &&
    allHandsFinished(players[currentPlayerIndex])
  ) {
    currentPlayerIndex++
  }

  if (currentPlayerIndex >= players.length) {
    resolvingRound = true
    updateActivePlayerHighlight()
    updateControls()
    messageEl.textContent = 'All players finished. Dealer is playing...'

    await sleep(2000)
    await playDealer()
    return
  }

  const player = players[currentPlayerIndex]
  player.activeHandIndex = 0

  updateActivePlayerHighlight()
  renderPlayers()
  updateControls()

  if (await autoResolveCurrentHand(player)) {
    return
  }

  messageEl.textContent = `${getCurrentHand(player).label}'s turn.`
}

async function resetRound() {
  resolvingRound = false
  await ensureDeck()

  dealerHand = [drawCard(deck), drawCard(deck)]
  currentPlayerIndex = 0

  players.forEach(player => {
  if (player.chips < 10) {
    player.hands = [
      {
        label: player.name,
        cards: [],
        stood: true,
        busted: false,
        bet: 0
      }
    ]
    player.activeHandIndex = 0
    return
  }

  const betAmount = player.betEl.value ? takeBet(player) : 10
  player.chips -= betAmount

  player.hands = [
    {
      label: player.name,
      cards: [drawCard(deck), drawCard(deck)],
      stood: false,
      busted: false,
      bet: betAmount
    }
  ]
  player.activeHandIndex = 0
})

  renderAll()
  checkInsurance()
  updateActivePlayerHighlight()
  updateControls()

  const firstPlayer = players[currentPlayerIndex]

  if (!(await autoResolveCurrentHand(firstPlayer))) {
    messageEl.textContent = `${getCurrentHand(firstPlayer).label}'s turn.`
  }
}

async function ensureDeck() {
  if (deck.length < 5+(5*playerCount)) {
    deck = shuffle(createDeck(deckCount))
    messageEl.textContent = 'Shuffling new deck...'
    updateControls(true)
    await sleep(2000)
    updateControls()
  }
}

function takeBet(player) {
  let betAmount = parseInt(player.betEl.value)
  
  if (isNaN(betAmount) || betAmount < 10 ) {
    betAmount = 10
  } else if (betAmount > 1000) {
    betAmount = 1000
  }

  if (betAmount > player.chips) {
    betAmount = player.chips
  }

  player.betEl.value = betAmount
  return betAmount
}

async function hitPlayer(player) {
  const hand = getCurrentHand(player)

  if (hand.stood || hand.busted) return

  hand.cards.push(drawCard(deck))
  renderPlayers()

  const total = getHandValue(hand.cards)

  if (total > 21) {
    hand.busted = true
    messageEl.textContent = `${hand.label} busts with ${total}.`

    await sleep(2000)
    await advanceHandOrTurn(player)
    return
  }

  if (isFiveCardCharlie(hand.cards)) {
    hand.stood = true
    messageEl.textContent = `${hand.label} gets a Five-Card Charlie!`

    await sleep(2000)
    await advanceHandOrTurn(player)
    return
  }

  messageEl.textContent = `${hand.label} hits and now has ${total}.`
}

async function standPlayer(player) {
  const hand = getCurrentHand(player)

  if (hand.stood || hand.busted) return

  hand.stood = true
  messageEl.textContent = `${hand.label} stands on ${getHandValue(hand.cards)}.`

  updateControls(true)
  await sleep(2000)
  updateControls()
  await advanceHandOrTurn(player)
}

async function doublePlayer(player) {
  const hand = getCurrentHand(player)

  if (hand.stood || hand.busted || !canDouble(hand.cards)) return

  if (player.chips < hand.bet) {
    messageEl.textContent = `${hand.label} does not have enough chips to double.`
    updateControls(true)
    await sleep(2000)
    updateControls()
    return
  }

  player.chips -= hand.bet
  hand.bet *= 2

  hand.cards.push(drawCard(deck))
  renderPlayers()

  const total = getHandValue(hand.cards)

  if (total > 21) {
    hand.busted = true
    messageEl.textContent = `${hand.label} doubles and busts with ${total}.`

    updateControls(true)
    await sleep(2000)
    updateControls()
    await advanceHandOrTurn(player)
    return
  }

  hand.stood = true
  messageEl.textContent = `${hand.label} doubles down to ${total}.`

  updateControls(true)
  await sleep(2000)
  updateControls()
  await advanceHandOrTurn(player)
}

async function splitPlayer(player) {
  const hand = getCurrentHand(player)

  if (!canSplit(hand.cards)) {
    messageEl.textContent = `${hand.label} cannot split.`
    return
  }

  if (player.chips < hand.bet) {
    messageEl.textContent = `${hand.label} does not have enough chips to split.`
    return
  }

  player.chips -= hand.bet

  const firstCard = hand.cards[0]
  const secondCard = hand.cards[1]

  player.hands = [
    {
      label: `${player.name}.1`,
      cards: [firstCard, drawCard(deck)],
      stood: false,
      busted: false,
      bet: hand.bet
    },
    {
      label: `${player.name}.2`,
      cards: [secondCard, drawCard(deck)],
      stood: false,
      busted: false,
      bet: hand.bet
    }
  ]

  player.activeHandIndex = 0

  renderPlayers()
  messageEl.textContent = `${player.name} splits into ${player.name}.1 and ${player.name}.2.`

  await sleep(2000)
  updateControls()

  await autoResolveCurrentHand(player)
}

async function checkInsurance() {
    if (dealerHand[0].value === 'A') {
      canInsure = true
      insuranceBtn.disabled = false
      messageEl.textContent = 'Dealer shows an Ace. Players can take insurance.'
      updateControls(true)
      await sleep(2000)
      updateControls()
    } else {
      canInsure = false
      insuranceBtn.disabled = true
    }
}

async function insurancePlayer(player) {
  if (!canInsure) {
    messageEl.textContent = 'Insurance is not available.'
    return
  }
  
  if (player.chips < player.bet / 2) {
    messageEl.textContent = `${player.name} does not have enough chips for insurance.`
    updateControls(true)
    await sleep(2000)
    updateControls()
    return
  }

  player.chips -= player.bet / 2
  renderPlayers()
  messageEl.textContent = `${player.name} takes insurance bet of ${player.bet / 2} chips.`
  updateControls(true)
  await sleep(2000)
  updateControls()
}

async function advanceHandOrTurn(player) {
  if (player.activeHandIndex < player.hands.length - 1) {
    player.activeHandIndex++
    renderPlayers()
    updateControls()

    if (await autoResolveCurrentHand(player)) {
      return
    }

    const nextHand = getCurrentHand(player)
    messageEl.textContent = `${nextHand.label}'s turn.`
    return
  }

  await advanceTurn()
}

async function playDealer() {
  renderDealer(false)
  messageEl.textContent = 'Dealer reveals the hidden card...'
  await sleep(2000)

  while (getHandValue(dealerHand) < 17) {
    dealerHand.push(drawCard(deck))
    renderDealer(false)

    messageEl.textContent = 'Dealer hits...'
    await sleep(2000)
  }

  const dealerTotal = getHandValue(dealerHand)

  if (dealerTotal > 21) {
    messageEl.textContent = `Dealer busts with ${dealerTotal}.`
    await sleep(2000)
    determineWinners()
    return
  }

  messageEl.textContent = `Dealer stands on ${dealerTotal}.`
  await sleep(2000)
  determineWinners()
}

function updateActivePlayerHighlight() {
  players.forEach((player, index) => {
    if (index === currentPlayerIndex) {
      player.el.classList.add('active')
    } else {
      player.el.classList.remove('active')
    }
  })
}

function determineWinners() {
  resolvingRound = false
  
  const dealerTotal = getHandValue(dealerHand)
  const dealerBlackjack = isBlackjack(dealerHand)
  const dealerCharlie = isFiveCardCharlie(dealerHand)

  const results = []

  players.forEach(player => {
    player.hands.forEach(hand => {
      const playerTotal = getHandValue(hand.cards)
      const playerBlackjack = isBlackjack(hand.cards)
      const playerCharlie = isFiveCardCharlie(hand.cards)

      if (hand.busted) {
        results.push(`${hand.label} loses`)
        return
      }

      if (playerBlackjack && dealerBlackjack) {
        player.chips += hand.bet
        results.push(`${hand.label} pushes with blackjack`)
        return
      }

      if (playerBlackjack) {
        player.chips += Math.floor(hand.bet * 2.5)
        results.push(`${hand.label} wins with blackjack`)
        return
      }

      if (dealerBlackjack) {
        results.push(`${hand.label} loses to dealer blackjack`)
        return
      }

      if (playerCharlie && dealerCharlie) {
        player.chips += hand.bet
        results.push(`${hand.label} pushes with Five-Card Charlie`)
        return
      }

      if (playerCharlie) {
        player.chips += hand.bet * 2
        results.push(`${hand.label} wins with Five-Card Charlie`)
        return
      }

      if (dealerCharlie) {
        results.push(`${hand.label} loses to dealer Five-Card Charlie`)
        return
      }

      if (dealerTotal > 21) {
        player.chips += hand.bet * 2
        results.push(`${hand.label} wins`)
        return
      }

      if (playerTotal > dealerTotal) {
        player.chips += hand.bet * 2
        results.push(`${hand.label} wins`)
        return
      }

      if (playerTotal < dealerTotal) {
        results.push(`${hand.label} loses`)
        return
      }

      player.chips += hand.bet
      results.push(`${hand.label} pushes`)
    })
  })

  renderPlayers()

  if (dealerBlackjack) {
    messageEl.textContent = `Dealer has Blackjack. ${results.join('. ')}.`
  } else if (dealerCharlie) {
    messageEl.textContent = `Dealer has Five-Card Charlie. ${results.join('. ')}.`
  } else if (dealerTotal > 21) {
    messageEl.textContent = `Dealer busts with ${dealerTotal}. ${results.join('. ')}.`
  } else {
    messageEl.textContent = `Dealer has ${dealerTotal}. ${results.join('. ')}.`
  }

  updateControls()
}

// Start button: validate and initialize players, then show table
startBtn.addEventListener('click', () => {
  const count = parseInt(document.getElementById('player-count').value)
  const decks = parseInt(document.getElementById('deck-count').value)

  if (isNaN(decks) || decks < 1 || decks > 4) {
    alert('Please enter a valid number of decks (1-4).')
    return
  }

  if (isNaN(count) || count < 1 || count > 4) {
    alert('Please enter a valid number of players (1-4).')
    return
  }

  playerCount = count
  deckCount = decks
  initializePlayers(playerCount)

  currentPlayerIndex = players.length
  dealerHand = []
  canInsure = false
  messageEl.textContent = 'Place bets, then press Deal.'
  dealerCardsEl.innerHTML = ''
  dealerScoreEl.textContent = ''

  document.getElementById('menu').classList.add('hidden')
  document.getElementById('table').classList.remove('hidden')

  startBtn.style.display = 'none'
  document.getElementById('player-count').style.display = 'none'
  document.getElementById('deck-count').style.display = 'none'

  menu = false
  updateControls()
})

// Wire up game control buttons (registered once)
dealBtn.addEventListener('click', async () => {
  if (dealBtn.disabled || resolvingRound) return
  await resetRound()
})

hitBtn.addEventListener('click', async () => {
  const player = getCurrentPlayer()
  if (!player) return
  await hitPlayer(player)
})

standBtn.addEventListener('click', async () => {
  const player = getCurrentPlayer()
  if (!player) return
  await standPlayer(player)
})

doubleBtn.addEventListener('click', async () => {
  const player = getCurrentPlayer()
  if (!player) return
  await doublePlayer(player)
})

splitBtn.addEventListener('click', async () => {
  const player = getCurrentPlayer()
  if (!player) return
  if (typeof splitPlayer === 'function') {
    await splitPlayer(player)
  }
})

insuranceBtn.addEventListener('click', async () => {
  const player = getCurrentPlayer()
  if (!player) return
  if (typeof insurancePlayer === 'function') {
    await insurancePlayer(player)
  }
})

mainMenuBtn.addEventListener('click', () => {
  menu = true
  document.getElementById('menu').classList.remove('hidden')
  document.getElementById('table').classList.add('hidden')

  deck = shuffle(createDeck(deckCount))
  dealerHand = []
  currentPlayerIndex = 0
  players = []
  canInsure = false

  dealerCardsEl.innerHTML = ''
  dealerScoreEl.textContent = ''
  playersContainer.innerHTML = ''
  messageEl.textContent = ''

  startBtn.style.display = 'inline-block'
  document.getElementById('player-count').style.display = 'inline-block'
  document.getElementById('deck-count').style.display = 'inline-block'
})
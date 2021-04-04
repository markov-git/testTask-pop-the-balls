const $app = document.querySelector('#app')
const $canvas = document.createElement('canvas')
const ctx = $canvas.getContext('2d')
const $score = document.querySelector('#score')
const $timer = document.querySelector('#timer')
const $modal = document.querySelector('#modal')
const $starter = $modal.querySelector('#starter')
const $info = $modal.querySelector('#info')
const $blasted = $modal.querySelector('#blasted')
const $missed = $modal.querySelector('#missed')

const TIME_LIMIT = 60
const MIN_RADIUS = 10
const MAX_RADIUS = 50
const COLORS = [
  '#8125A7',
  '#E45599',
  '#C4DC61',
  '#4EE5DC',
  '#45B043',
  '#886C70',
  '#487FB3',
  '#F96DCC',
  '#D55E58',
  '#E38B2B',
]
let currentTime
let currentScore
let missedBallsCount
const MAX_TIMEOUT = 800
const MIN_TIMEOUT = 200
let balloonsTimeout
const MAX_ANTI_GRAVITY = 8
const MIN_ANTI_GRAVITY = 2
let currentAntigravity
const WIND_ADD = 2
const MAX_WIND = 10
let wind
let isGameEnd
let balloons = []

const canvasSize = {
  width: $app.clientWidth,
  height: $app.clientHeight,
}

const defender = {
  x: canvasSize.width / 2,
  y: 0,
  height: 50,
  width: 10,
  get spearhead() {
    return {
      x: this.x,
      y: this.height,
    }
  },
}

class Balloon {
  constructor() {
    this.radius = MIN_RADIUS + Math.round(Math.random() * (MAX_RADIUS - MIN_RADIUS))
    this.x = Math.round(Math.random() * (canvasSize.width - this.radius * 2)) + this.radius
    this.y = canvasSize.height + this.radius
    this.color = COLORS[Math.round(Math.random() * COLORS.length)]
    this.antigravity = currentAntigravity
    this.isReady = false
  }

  move() {
    this.y -= this.antigravity

    const myWind = wind >= 0
      ? wind * (canvasSize.width - this.x) / canvasSize.width
      : wind * this.x / canvasSize.width

    if (this.x + myWind > this.radius && this.x + myWind < canvasSize.width - this.radius) {
      this.x += myWind
    }

    this.isReady = Balloon.isReadyToBlast(this.x, this.y, this.radius)
    return this.isReady
  }

  drawBalloons() {
    ctx.beginPath()
    ctx.fillStyle = this.color
    ctx.arc(this.x, this.y,
      this.radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
  }

  blast() {
    upScore()
  }

  static isReadyToBlast(x, y, radius) {
    const {x: defenderX, y: defenderY} = defender.spearhead
    const dx = defenderX - x
    const dy = defenderY - y
    const length = Math.sqrt(dx ** 2 + dy ** 2)
    return length < radius
  }
}

initGame()

function initGame() {
  $app.append($canvas)

  setNodeSize($canvas, canvasSize.width, canvasSize.height)
  drawDefender()

  addEventListener('mousemove', ({clientX}) => {
    if (!isGameEnd) {
      defender.x = clientX
    }
  })

  $starter.addEventListener('click', () => {
    $modal.classList.toggle('hide')
    startGame()
  })
}

function startGame() {
  isGameEnd = false
  wind = 0
  currentTime = 0
  currentScore = 0
  upScore(0)
  missedBallsCount = 0
  balloonsTimeout = MAX_TIMEOUT
  currentAntigravity = MIN_ANTI_GRAVITY

  const timer = setInterval(() => {
    currentTime++
    $timer.innerHTML = (TIME_LIMIT - currentTime).toString().padStart(2, '0')
    if (currentTime >= TIME_LIMIT) {
      clearInterval(timer)
      currentTime = 0
      isGameEnd = true
      return
    }
    balloonsTimeout = MAX_TIMEOUT - (MAX_TIMEOUT - MIN_TIMEOUT) * currentTime / TIME_LIMIT
    currentAntigravity = MIN_ANTI_GRAVITY + (MAX_ANTI_GRAVITY - MIN_ANTI_GRAVITY) * currentTime / TIME_LIMIT

    if (wind + WIND_ADD > MAX_WIND) {
      wind -= Math.round(Math.random() * WIND_ADD)
    } else if (wind - WIND_ADD < -MAX_WIND) {
      wind += Math.round(Math.random() * WIND_ADD)
    } else {
      wind += Math.round((Math.random() * 2 - 1) * WIND_ADD)
    }

  }, 1000)
  balloons.push(new Balloon())
  createNextBalloons()
  on()
}

function createNextBalloons() {
  setTimeout(() => {
    balloons.push(new Balloon())
    if (isGameEnd) {
      return
    }
    createNextBalloons()
  }, balloonsTimeout)
}

function upScore(increment = 1) {
  currentScore += increment
  $score.innerHTML = currentScore.toString().padStart(3, '0')
}

function on() {
  clearCanvas()
  drawDefender()
  balloons = balloons.filter(balloon => {
    balloon.drawBalloons()
    const isBlast = balloon.move()
    if (isBlast) {
      balloon.blast()
    }
    const outSide = balloon.y + balloon.radius <= 0
    if (outSide) {
      missedBallsCount++
    }
    return !isBlast && !outSide
  })

  if (isGameEnd && balloons.length === 0) {
    clearCanvas()
    drawDefender()
    showModal()
    return
  }
  window.requestAnimationFrame(on)
}

function showModal() {
  $modal.classList.remove('hide')
  $info.classList.remove('hide')
  $blasted.innerHTML = currentScore.toString()
  $missed.innerHTML = missedBallsCount.toString()
}

function setNodeSize(node, width, height) {
  node.width = width
  node.height = height
}

function clearCanvas() {
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
}

function drawDefender() {
  ctx.beginPath()
  ctx.fillStyle = '#fff'
  ctx.moveTo(defender.x - defender.width / 2, 0)
  ctx.lineTo(defender.x, defender.height)
  ctx.lineTo(defender.x + defender.width / 2, 0)
  ctx.closePath()
  ctx.fill()
}

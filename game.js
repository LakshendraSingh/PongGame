// =======================
// CONFIGURATION
// =======================
// SECURITY NOTE:
// It is safe to expose the 'anon' key in the browser ONLY IF you have enabled
// Row Level Security (RLS) on your Supabase table.
// 1. Go to Authentication > Policies in Supabase.
// 2. Enable RLS for the 'leaderboard' table.
// 3. Create a policy: "Enable INSERT for anon users" and "Enable SELECT for anon users".
// 4. NEVER paste your 'service_role' key here!

const SUPABASE_URL = "https://glesquvczauoqxxbdbdt.supabase.co" // Example: https://xyz.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZXNxdXZjemF1b3F4eGJkYmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjUwMjYsImV4cCI6MjA4NjQwMTAyNn0.HiXkjS5cXrG38RZCcODu0axwFgWSuYVklc_lV-ZZXa8" // This is the public key

// =======================
// SUPABASE SETUP (SAFE MODE)
// =======================
let sb = null;
try {
    // Check if keys are configured
    if (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith("https") && SUPABASE_ANON_KEY.length > 20) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("System: Online - Connected to Supabase");
    } else {
        console.warn("System: Offline Mode. (Add your URL and ANON KEY in script.js to enable the leaderboard)");
    }
} catch (e) {
    console.error("Supabase init failed:", e);
}

// =======================
// CANVAS SETUP
// =======================
const canvas = document.getElementById("game")
if (!canvas) {
    console.error("Canvas element not found!");
    throw new Error("Canvas missing");
}
const ctx = canvas.getContext("2d")

const W = canvas.width
const H = canvas.height

// =======================
// GAME STATE
// =======================
let playerScore = 0
let aiScore = 0
const paddleH = 90
const paddleW = 15
const paddleSpeed = 8

// Entities
const player = { x: 20, y: H/2 - paddleH/2, color: "#00f3ff" }
const ai = { x: W - 35, y: H/2 - paddleH/2, color: "#bc13fe" }
const ball = { x: W/2, y: H/2, dx: 5, dy: 3, size: 10, color: "#ffffff" }

// Input State
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false }

// Particles
let particles = []

// =======================
// CONTROLS
// =======================
document.addEventListener("keydown", e => {
  if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) keys[e.key] = true
})
document.addEventListener("keyup", e => {
  if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) keys[e.key] = false
})

// =======================
// PARTICLE SYSTEM
// =======================
class Particle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color
    this.size = Math.random() * 3 + 1
    this.speedX = Math.random() * 6 - 3
    this.speedY = Math.random() * 6 - 3
    this.life = 1.0
  }
  update() {
    this.x += this.speedX
    this.y += this.speedY
    this.life -= 0.03
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}

function spawnParticles(x, y, color) {
  for(let i=0; i<10; i++) {
    particles.push(new Particle(x, y, color))
  }
}

// =======================
// GAME LOGIC
// =======================
function update() {
  // 1. Move Player
  if (keys["w"] || keys["ArrowUp"]) player.y -= paddleSpeed
  if (keys["s"] || keys["ArrowDown"]) player.y += paddleSpeed

  // Clamp Player
  player.y = Math.max(0, Math.min(H - paddleH, player.y))

  // 2. Move Ball
  ball.x += ball.dx
  ball.y += ball.dy

  // Bounce Top/Bottom
  if (ball.y <= 0 || ball.y >= H - ball.size) {
    ball.dy *= -1
    spawnParticles(ball.x, ball.y, "#ffffff")
  }

  // 3. AI Movement (Simple tracking with delay)
  if (ball.dx > 0) {
    let targetY = ball.y - paddleH / 2
    ai.y += (targetY - ai.y) * 0.08
  }
  ai.y = Math.max(0, Math.min(H - paddleH, ai.y))

  // 4. Paddle Collisions
  if (hit(player)) {
    reflect(player, 1)
    spawnParticles(player.x + paddleW, ball.y, player.color)
  }
  if (hit(ai)) {
    reflect(ai, -1)
    spawnParticles(ai.x, ball.y, ai.color)
  }

  // 5. Score Points
  if (ball.x < 0) {
    aiScore++
    resetBall(1)
  }
  if (ball.x > W) {
    playerScore++
    resetBall(-1)
  }

  // 6. Update Particles (Filter out dead ones)
  particles.forEach(p => p.update())
  particles = particles.filter(p => p.life > 0)
}

function hit(p) {
  return ball.x < p.x + paddleW &&
        ball.x + ball.size > p.x &&
        ball.y < p.y + paddleH &&
        ball.y + ball.size > p.y
}

function reflect(p, dir) {
  let speed = Math.sqrt(ball.dx**2 + ball.dy**2) * 1.1 // Increased acceleration (1.1x per hit)
  speed = Math.min(speed, 25) // Increased Max speed cap

  // Calculate bounce angle based on hit position
  let relativeIntersectY = (p.y + (paddleH / 2)) - ball.y
  let normalizedIntersectY = (relativeIntersectY / (paddleH / 2))
  let bounceAngle = normalizedIntersectY * Math.PI / 4 

  ball.dx = speed * Math.cos(bounceAngle) * dir
  ball.dy = speed * -Math.sin(bounceAngle)
  ball.x += ball.dx // Push out of paddle
}

function resetBall(dir) {
  ball.x = W / 2
  ball.y = H / 2
  
  // Base speed increases with total score (0.5 per point)
  let baseSpeed = 5 + (playerScore + aiScore) * 0.5
  
  ball.dx = baseSpeed * dir
  ball.dy = (Math.random() * 4 - 2)
}

// =======================
// DRAWING
// =======================
function draw() {
  // Clear Background
  ctx.fillStyle = "#0a0a0f" 
  ctx.fillRect(0, 0, W, H)

  // Net
  ctx.fillStyle = "#222"
  ctx.shadowBlur = 0
  for (let y = 0; y < H; y += 30) {
    ctx.fillRect(W / 2 - 1, y, 2, 15)
  }

  // Global Glow Settings
  ctx.shadowBlur = 15

  // Draw Player
  ctx.shadowColor = player.color
  ctx.fillStyle = player.color
  ctx.fillRect(player.x, player.y, paddleW, paddleH)

  // Draw AI
  ctx.shadowColor = ai.color
  ctx.fillStyle = ai.color
  ctx.fillRect(ai.x, ai.y, paddleW, paddleH)

  // Draw Ball
  ctx.shadowColor = "#ffffff"
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(ball.x, ball.y, ball.size, ball.size)

  // Draw Particles
  particles.forEach(p => {
    ctx.shadowColor = p.color
    p.draw(ctx)
  })

  // Draw HUD
  ctx.shadowBlur = 0
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
  ctx.font = "60px 'Orbitron', sans-serif"
  ctx.fillText(playerScore, W / 2 - 100, 80)
  ctx.fillText(aiScore, W / 2 + 60, 80)
}

function loop() {
  update()
  draw()
  requestAnimationFrame(loop)
}

// Start the game loop immediately
loop()

// =======================
// LEADERBOARD FUNCTIONS
// =======================

async function submitScore() {
  if (!sb) { alert("Offline Mode: Cannot save score."); return; }
  
  const nameInput = document.getElementById("name")
  const name = nameInput.value.trim() || "UNK"

  if(playerScore === 0) { alert("Score some points first!"); return; }

  const { error } = await sb.from("leaderboard").insert({
    name: name.toUpperCase(),
    score: playerScore
  })

  if (error) {
    console.error(error)
    alert("Error saving score")
  } else {
    alert("SCORE UPLOADED")
    loadBoard()
    playerScore = 0
    aiScore = 0
    resetBall(1)
  }
}

async function loadBoard() {
  const tbody = document.getElementById("board-body")
  
  if (!sb) {
    tbody.innerHTML = `<tr><td colspan="3">OFFLINE MODE</td></tr>`
    return
  }
  
  tbody.innerHTML = `<tr><td colspan="3" class="loading-text">FETCHING DATA...</td></tr>`

  const { data, error } = await sb
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(10)

  if (error) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:red">CONNECTION FAILED</td></tr>`
    return
  }

  if(!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">NO DATA FOUND</td></tr>`
    return
  }

  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.score}</td>
    </tr>
  `).join("")
}

// Try to load board if online
loadBoard()
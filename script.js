// =====================
// Global Variables
// =====================
let users = [{ username: "p", password: "testuser" }];
let currentUser = null;
let userScores = {};
let config = {
  shootKey: " ",
  gameTime: 120,
  playerColor: "#aa00ff",
  enemyColor: "#ff3333"
};

let keys = {};
let shootKey = " ";
let canvas, ctx;
let player, bullets, enemyBullets, enemies;
let score = 0, lives = 3, timeLeft = 0, timeElapsed = 0, speedUps = 0;
let timerInterval;
let gameRunning = false;
let enemyDirection = 1;
let enemySpeed = 1;
let enemyBulletDelay = true;

// =====================
// Screen Navigation
// =====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(div => div.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function openModal() {
  document.getElementById("aboutModal").style.display = "block";
}
function closeModal() {
  document.getElementById("aboutModal").style.display = "none";
}
window.onclick = e => {
  if (e.target === document.getElementById("aboutModal")) closeModal();
};
window.onkeydown = e => {
  if (e.key === "Escape") closeModal();
};

// =====================
// Registration & Login
// =====================
function registerUser(event) {
  event.preventDefault();
  let u = document.getElementById("regUsername").value;
  let p = document.getElementById("regPassword").value;
  let v = document.getElementById("verifyPassword").value;
  let f = document.getElementById("firstName").value;
  let l = document.getElementById("lastName").value;
  let e = document.getElementById("email").value;

  if (!u || !p || !v || !f || !l || !e) return showMsg("registerMsg", "All fields are required.");
  if (/\d/.test(f) || /\d/.test(l)) return showMsg("registerMsg", "Names cannot contain numbers.");
  if (!p.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)) return showMsg("registerMsg", "Password must be 8+ chars, include a number and special char.");
  if (p !== v) return showMsg("registerMsg", "Passwords do not match.");
  if (!e.includes("@")) return showMsg("registerMsg", "Invalid email.");
  if (users.find(user => user.username === u)) return showMsg("registerMsg", "Username already taken.");

  users.push({ username: u, password: p });
  showMsg("registerMsg", "Registration successful!");
}

function loginUser(event) {
  event.preventDefault();
  let u = document.getElementById("loginUsername").value;
  let p = document.getElementById("loginPassword").value;
  const user = users.find(user => user.username === u && user.password === p);
  if (!user) return showMsg("loginMsg", "Invalid username or password.");

  currentUser = u;
  userScores[currentUser] = [];
  showMsg("loginMsg", "");
  showScreen("config");
}

// =====================
// Game Config
// =====================
function startConfiguredGame() {
  shootKey = document.getElementById("shootKey").value;
  config.shootKey = shootKey;
  config.gameTime = Math.max(120, parseInt(document.getElementById("gameTime").value) * 60);
  config.playerColor = document.getElementById("playerColor").value;
  document.getElementById("backgroundMusic").play();
  initGame();
}

// =====================
// Game Setup
// =====================
function initGame() {
  showScreen("game");
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  player = {
    x: Math.random() * (canvas.width - 60),
    y: canvas.height * 0.65,
    w: 60, h: 40,
    speed: 6,
    color: config.playerColor
  };

  bullets = [];
  enemyBullets = [];
  enemies = [];
  score = 0;
  lives = 3;
  timeLeft = config.gameTime;
  timeElapsed = 0;
  speedUps = 0;
  enemySpeed = 1;
  enemyDirection = 1;
  gameRunning = true;

  createEnemies();
  setupTimer();
  requestAnimationFrame(gameLoop);
}

function createEnemies() {
  const rows = 4, cols = 5, spacing = 80, startX = 300, startY = 80;
  const colors = ["#ff4444", "#ff9900", "#33cc33", "#3399ff"]; // red, orange, green, blue
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * spacing,
        y: startY + r * spacing,
        w: 50, h: 30,
        alive: true,
        row: r,
        color: colors[r]
      });
    }
  }
}


// =====================
// Timer and Score UI
// =====================
function setupTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timeElapsed++;
    if (timeElapsed % 5 === 0 && speedUps < 4) {
      enemySpeed += 0.5;
      speedUps++;
    }
    updateUI();

    if (timeLeft <= 0) endGame("time");
  }, 1000);
}

function updateUI() {
  document.getElementById("score").textContent = "Score: " + score;
  document.getElementById("lives").textContent = "Lives: " + lives;
  document.getElementById("timer").textContent = "Time Left: " + timeLeft + "s";
}

function showMsg(id, msg) {
  document.getElementById(id).textContent = msg;
}

// =====================
// Game Loop
// =====================
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  movePlayer();
  moveEnemies();
  updateBullets();
  checkCollisions();
  drawPlayer();
  drawEnemies();
  drawBullets();
  updateUI();
  if (lives <= 0) return endGame("death");
  if (enemies.every(e => !e.alive)) return endGame("cleared");

  requestAnimationFrame(gameLoop);
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawEnemies() {
  enemies.forEach(e => {
    if (e.alive) {
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  });
}


function drawBullets() {
  ctx.fillStyle = "violet";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  ctx.fillStyle = "yellow";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
}

function movePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.w < canvas.width) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > canvas.height * 0.6) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += player.speed;
}

function moveEnemies() {
  let hitWall = enemies.some(e => e.alive && (e.x + e.w > canvas.width || e.x < 0));
  if (hitWall) enemyDirection *= -1;
  enemies.forEach(e => { if (e.alive) e.x += enemySpeed * enemyDirection; });
  if (enemyBulletDelay) {
    let shooters = enemies.filter(e => e.alive);
    if (shooters.length > 0) {
      let e = shooters[Math.floor(Math.random() * shooters.length)];
      enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, w: 4, h: 12, speed: 3 + speedUps });
      document.getElementById("enemyShoot").play();
      enemyBulletDelay = false;
      setTimeout(() => enemyBulletDelay = true, 1000);
    }
  }
}

function updateBullets() {
  bullets.forEach(b => b.y -= b.speed);
  enemyBullets.forEach(b => b.y += b.speed);
  bullets = bullets.filter(b => b.y > 0);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
}

function checkCollisions() {
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (e.alive && b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        e.alive = false;
        b.y = -10;
        score += (4 - e.row) * 5;
        document.getElementById("explode").play();
      }
    });
  });

  enemyBullets.forEach(b => {
    if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
      lives--;
      player.x = Math.random() * (canvas.width - 60);
      player.y = canvas.height * 0.65;
      enemyBullets = [];
      document.getElementById("bomb").play();
    }
  });
}

// =====================
// Input Handling
// =====================
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === shootKey && bullets.length < 1) {
    bullets.push({
      x: player.x + player.w / 2 - 2,
      y: player.y,
      w: 4, h: 12,
      speed: 7
    });
    document.getElementById("shoot").play();
  }
});
window.addEventListener("keyup", e => keys[e.key] = false);

// =====================
// End Game & Scores
// =====================
function endGame(reason) {
  gameRunning = false;
  clearInterval(timerInterval);
  document.getElementById("backgroundMusic").pause();

  let message = "";
  if (reason === "death") message = "You Lost!";
  else if (reason === "time" && score < 100) message = "You can do better!";
  else if (reason === "cleared") message = "Champion!";
  else message = "Winner";

  alert(`${message}\nScore: ${score}`);
  userScores[currentUser].push(score);
  showHighScores();
  showScreen("welcome");
}

function showHighScores() {
  let scores = userScores[currentUser];
  scores.sort((a, b) => b - a);
  let pos = scores.indexOf(score) + 1;
  alert("High Scores:\n" + scores.join("\n") + `\nYour position: ${pos}`);
}

function startNewGame() {
  if (!currentUser) {
    alert("Please login to play.");
    return;
  }
  showScreen("config");
}

// =====================
// Global Variables
// =====================
let users = [{ username: "p", password: "testuser" }];
let currentUser = null;
let userScores = {};
let config = {
  shootKey: " ",
  gameTime: 120,
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
let currentScreen = "welcome";
let isPaused = false;
let canShoot = true; 
let playerImage, enemyImage;
let movementBoundary; // For restricting player to bottom 40%
let currentScore;

// =====================
// Screen Navigation
// =====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(div => div.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentScreen = id;
  
  // Stop all sounds when changing screens
  if (id !== "game") {
    stopAllSounds();
  }
  
  // Play selection sound if not on welcome screen
  if (id !== "welcome") {
    playSound("select");
  }
  
  // Start background music only when entering the game screen
  if (id === "game") {
    playSound("backgroundMusic");
  }
}

function openModal() {
  document.getElementById("aboutModal").style.display = "block";
  playSound("select");
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
// Sound Management
// =====================
function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.currentTime = 0;
    
    // Set volume for background music
    if (id === "backgroundMusic") {
      sound.volume = 0.4;
      sound.loop = true;
    }
    
    sound.play().catch(e => console.log("Audio play error:", e));
  }
}

function stopSound(id) {
  const sound = document.getElementById(id);
  if (sound && !sound.paused) {
    sound.pause();
    sound.currentTime = 0;
  }
}

function stopAllSounds() {
  // Find all audio elements on the page and stop them
  const allAudioElements = document.querySelectorAll('audio');
  allAudioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

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
  let day = document.getElementById("dobDay").value;
  let month = document.getElementById("dobMonth").value;
  let year = document.getElementById("dobYear").value;

  if (!u || !p || !v || !f || !l || !e || !day || !month || !year) 
    return showMsg("registerMsg", "All fields are required.");
  if (/\d/.test(f) || /\d/.test(l)) 
    return showMsg("registerMsg", "Names cannot contain numbers.");
  if (!p.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)) 
    return showMsg("registerMsg", "Password must be 8+ chars, include a number and special char.");
  if (p !== v) 
    return showMsg("registerMsg", "Passwords do not match.");
  if (!e.includes("@")) 
    return showMsg("registerMsg", "Invalid email.");
  if (users.find(user => user.username === u)) 
    return showMsg("registerMsg", "Username already taken.");

  users.push({ 
    username: u, 
    password: p,
    firstName: f,
    lastName: l,
    email: e,
    dob: `${year}-${month}-${day}`
  });
  
  playSound("bonus");
  showMsg("registerMsg", "Registration successful! You can now login.");
  document.getElementById("regForm").reset();
}

function loginUser(event) {
  event.preventDefault();
  let u = document.getElementById("loginUsername").value;
  let p = document.getElementById("loginPassword").value;
  const user = users.find(user => user.username === u && user.password === p);
  
  // Clear form fields immediately regardless of login success
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  
  if (!user) return showMsg("loginMsg", "Invalid username or password.");

  currentUser = u;
  if (!userScores[currentUser]) userScores[currentUser] = [];
  
  playSound("select");
  showMsg("loginMsg", "");
  showScreen("config");
}

// =====================
// Messages
// =====================
function showMsg(id, msg) {
  document.getElementById(id).innerText = msg;
}

// =====================
// Game Config
// =====================
function startConfiguredGame() {
  shootKey = document.getElementById("shootKey").value;
  config.shootKey = shootKey;
  config.gameTime = Math.max(120, parseInt(document.getElementById("gameTime").value) * 60);
  config.playerColor = document.getElementById("playerColor").value;
  config.enemyColor = document.getElementById("enemyColor").value || "#ff3333";
  
  playSound("start");
  initGame();
}

// =====================
// Game Setup
// =====================
function initGame() {
  showScreen("game");
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
   
  playerImage = new Image();
  playerImage.src = "assets/images/spaceship.png";
  
  enemyImage = new Image();
  enemyImage.src = "assets/images/invader.png";

  // Calculate the movement boundary (40% of bottom screen)
  movementBoundary = canvas.height * 0.6; // Player can only move in bottom 40%
  
  player = {
    x: Math.random() * (canvas.width - 60),
    y: canvas.height * 0.65,
    w: 60, h: 40,
    speed: 6
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
  canShoot = true;

  createEnemies();
  setupTimer();
  updateUI();
  requestAnimationFrame(gameLoop);
}

function createEnemies() {
  // Create 20 enemies in a 4x5 formation
  const rows = 4, cols = 5, spacing = 80, startX = 300, startY = 80;
  
  // הגדרת צבעים שונים לכל שורה
  const rowColors = [
    "#ff0000", 
    "#ffff00", 
    "#00ff00", 
    "#0099ff"  
  ];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * spacing,
        y: startY + r * spacing,
        w: 50, h: 30,
        alive: true,
        row: r, 
        color: rowColors[r] 
      });
    }
  }
}

// =====================
// Timer and Score UI
// =====================
function setupTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timeElapsed++;
    
    // Speed up enemies every 5 seconds, max 4 times
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = 
    minutes.toString().padStart(2, '0') + ":" + 
    seconds.toString().padStart(2, '0');

  document.getElementById("timer").textContent = "Time Left: " + formattedTime;
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
  
  if (lives <= 0) return endGame("death");
  if (enemies.every(e => !e.alive)) return endGame("cleared");

  requestAnimationFrame(gameLoop);
}

function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (enemy.alive) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = enemy.w;
      tempCanvas.height = enemy.h;
     
      tempCtx.drawImage(enemyImage, 0, 0, enemy.w, enemy.h);
     
      const imageData = tempCtx.getImageData(0, 0, enemy.w, enemy.h);
      const data = imageData.data;
      
      const targetColor = hexToRgb(enemy.color);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] > 0) {
          if (data[i] > 30 || data[i+1] > 30 || data[i+2] > 30) {
            data[i] = targetColor.r;     
            data[i+1] = targetColor.g;   
            data[i+2] = targetColor.b;   
          }
        }
      }
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, enemy.x, enemy.y, enemy.w, enemy.h);
    }
  });
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  let bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function drawBullets() {
  // Draw player bullets (make them clearly visible)
  ctx.fillStyle = "#00ffff"; // Bright cyan color for player bullets
  bullets.forEach(b => {
    // Draw larger, more visible player bullets
    ctx.fillRect(b.x, b.y, b.w, b.h);
    
    // Add a glowing effect
    ctx.beginPath();
    ctx.arc(b.x + b.w/2, b.y + b.h/2, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
    ctx.fill();
  });
  
  // Draw enemy bullets
  ctx.fillStyle = "#ffff00"; // Yellow for enemy bullets
  enemyBullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

function movePlayer() {
  // Restrict player movement to bottom 40% of screen
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.w < canvas.width) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > movementBoundary) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += player.speed;
  if (keys[shootKey] && canShoot) shoot();
}

function moveEnemies() {
  let hitWall = false;
  
  // Check if any enemy hit a wall
  enemies.forEach(e => {
    if (e.alive) {
      if ((e.x + e.w + enemySpeed * enemyDirection > canvas.width) || 
          (e.x + enemySpeed * enemyDirection < 0)) {
        hitWall = true;
      }
    }
  });
  
  // Change direction if hit wall
  if (hitWall) enemyDirection *= -1;
  
  // Move all enemies
  enemies.forEach(e => { 
    if (e.alive) e.x += enemySpeed * enemyDirection; 
  });
  
  // Enemy shooting logic
  if (enemyBulletDelay) {
    let aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      // Pick random enemy to shoot
      let shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      
      // Only allow new enemy bullet when previous one traveled 3/4 of screen
      let canEnemyShoot = true;
      if (enemyBullets.length > 0) {
        // Calculate progress of furthest bullet
        let maxProgress = 0;
        enemyBullets.forEach(bullet => {
          let progress = bullet.y / canvas.height;
          if (progress > maxProgress) maxProgress = progress;
        });
        
        // Only allow new shot if furthest bullet passed 3/4 of screen
        if (maxProgress < 0.75) canEnemyShoot = false;
      }
      
      if (canEnemyShoot) {
        enemyBullets.push({ 
          x: shooter.x + shooter.w / 2, 
          y: shooter.y + shooter.h, 
          w: 4, h: 12, 
          speed: 3 + speedUps // Speed increases with speedUps
        });
        playSound("enemyShoot");
        enemyBulletDelay = false;
        setTimeout(() => enemyBulletDelay = true, 800 - speedUps * 100); // Faster recharge with speed ups
      }
    }
  }
}

function updateBullets() {
  bullets.forEach(b => b.y -= b.speed);
  enemyBullets.forEach(b => b.y += b.speed);
  bullets = bullets.filter(b => b.y > 0);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
}

function shoot() {
  if (canShoot) {
    bullets.push({ 
      x: player.x + player.w / 2 - 2, 
      y: player.y, 
      w: 4, h: 12, // Make the bullet slightly larger
      speed: 7 
    });
    playSound("shoot");
    canShoot = false;
    setTimeout(() => canShoot = true, 300); // Cooldown
  }
}

function checkCollisions() {
  // Check player bullets vs enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (e.alive && 
          b.x < e.x + e.w && 
          b.x + b.w > e.x && 
          b.y < e.y + e.h && 
          b.y + b.h > e.y) {
        
        e.alive = false;
        bullets.splice(i, 1);
        
        // Score based on enemy row (rows are 0-indexed)
        // Row 0 (top row) = 20 points
        // Row 1 = 15 points
        // Row 2 = 10 points
        // Row 3 (bottom row) = 5 points
        score += (4 - e.row) * 5;
        
        playSound("explode");
        updateUI();
        break;
      }
    }
  }

  // Check enemy bullets vs player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (b.x < player.x + player.w && 
        b.x + b.w > player.x && 
        b.y < player.y + player.h && 
        b.y + b.h > player.y) {
      
      lives--;
      updateUI();
      
      // Reset player position to bottom with random X
      player.x = Math.random() * (canvas.width - 60);
      player.y = canvas.height * 0.65;
      
      // Clear all enemy bullets
      enemyBullets = [];
      
      playSound("bomb");
      
      if (lives <= 0) {
        endGame("death");
      }
      break;
    }
  }
}

// =====================
// Input Handling
// =====================
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === "Home") {
    // Stop the game loop
    gameRunning = false;
    
    // Clear timer interval
    clearInterval(timerInterval);
    
    // Stop all sounds
    stopAllSounds(); 
    
    // Go back to welcome screen
    showScreen("welcome");
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

window.addEventListener("keydown", function(e) {
  if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener("keypress", function(e) {
  if(e.key === " " || e.code === "Space") {
    e.preventDefault();
  }
});

// =====================
// End Game & Scores
// =====================
function endGame(reason) {
  if (!gameRunning) return; 
  gameRunning = false;
  clearInterval(timerInterval);

  // Stop all sounds including background music
  stopAllSounds();

  let message = "";
  if (reason === "death") {
    message = "You Lost!";
    playSound("bomb");
  }
  else if (reason === "time" && score < 100) {
    message = "You can do better!";
    playSound("select");
  }
  else if (reason === "cleared") {
    message = "Champion!";
    playSound("bonus");
  }
  else {
    message = "Winner!";
    playSound("bonus");
  }
  showGameNotification(`${message}\nScore: ${score}`);

  if (currentUser) {
    if (!userScores[currentUser]) userScores[currentUser] = [];
    userScores[currentUser].push(score);
    currentScore = score;
  }
}

function showHighScores() {
  const scores = userScores[currentUser] || [];
  const sorted = [...scores].sort((a, b) => b - a);
  const pos = sorted.indexOf(currentScore) + 1;

  showGameNotification(`High Scores:\n${sorted.slice(0, 5).join("\n")}\nYour position: ${pos}`);
  setTimeout(() => {
    showScreen("welcome");
  }, 100);
}

function showGameNotification(message) {
  const notification = document.getElementById("gameNotification");
  const messageElement = document.getElementById("notificationMessage");
  
  messageElement.innerHTML = message.replace(/\n/g, '<br>');
  
  notification.style.display = "flex";
}

function closeNotification() {
  const notification = document.getElementById("gameNotification");
  notification.style.display = "none";
  
  if (currentUser && currentScore !== undefined) {
    showHighScores();
    currentScore = undefined;
  }
}

function startNewGame() {
  if (!currentUser) {
    showGameNotification("Please login to play.");
    return;
  }
  showScreen("config");
}

// =====================
// Function to populate the date dropdowns (Day, Month, Year)
// =====================
function populateDateDropdowns() {
  const yearSelect = document.getElementById('dobYear');
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 100; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  const monthSelect = document.getElementById('dobMonth');
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement('option');
    const monthNumber = month < 10 ? `0${month}` : `${month}`;
    option.value = month;
    option.textContent = monthNumber;
    monthSelect.appendChild(option);
  }

  const daySelect = document.getElementById('dobDay');
  for (let day = 1; day <= 31; day++) {
    const option = document.createElement('option');
    const dayNumber = day < 10 ? `0${day}` : `${day}`;
    option.value = day;
    option.textContent = dayNumber;
    daySelect.appendChild(option);
  }
}

document.addEventListener('DOMContentLoaded', populateDateDropdowns);

// =====================
// Restart & Game Over
// =====================
function restartGame() {
  // Stop all sounds before restarting
  stopAllSounds();
  
  player.x = canvas.width / 2 - 30;
  player.y = canvas.height * 0.65;
  initGame();
}

function goToMainMenu() {
  stopAllSounds();
  showScreen("welcome");
}
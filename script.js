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

// Game state variables - initialized in initGame()
let keys = {};
let shootKey = " ";
let canvas, ctx;
let player, bullets, enemyBullets, enemies;
let score, lives, timeLeft, timeElapsed, speedUps;
let timerInterval = null;
let gameRunning = false;
let enemyDirection;
let enemySpeed;
let enemyBulletDelay = true;
let currentScreen = "welcome";
let isPaused = false;
let canShoot = true; 
let playerImage, enemyImage;
let movementBoundary; // For restricting player to bottom 40%
let currentScore;
let soundTimers = []; // Track setTimeout IDs for sounds
let gameActive = false; // Flag to control game-related sounds

// Constants to ensure consistent game behavior
const PLAYER_BASE_SPEED = 6;
const INITIAL_ENEMY_SPEED = 1;
const MAX_ENEMY_SPEED = 3;
const INITIAL_ENEMY_BULLET_SPEED = 3;
const MAX_ENEMY_BULLET_SPEED = 5;
const PLAYER_SHOOT_COOLDOWN = 700; // Longer cooldown in milliseconds
const PLAYER_BULLET_SPEED = 7;
const MAX_PLAYER_BULLETS = 3; // Optional: limit total bullets on screen

// =====================
// Screen Navigation
// =====================
// update the showScreen function to clear messages when changing screens
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(div => div.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentScreen = id;

   // Hide header for game and config screens
   const header = document.querySelector('header');
   if (id === 'game' || id === 'config') {
     header.style.display = 'none';
   } else {
     header.style.display = 'block';
   }
  
  // Clear any messages on screen change
  document.querySelectorAll('.message').forEach(msg => msg.textContent = "");
  
  // Clear all timers when changing screens
  clearAllTimers();
  
  // Stop all sounds when changing screens
  if (id !== "game") {
    stopAllSounds();
    gameActive = false;
  }

  //Play selection sound if not on welcome screen
  if (id !== "welcome") {
    playSound("select");
  }
  
  // Make sure starfield is visible behind game
  document.getElementById('particles-container').style.zIndex = "-1";
  
  // Start background music only when entering the game screen
  if (id === "game") {
    playSound("backgroundMusic");
    gameActive = true;
    
    // Make sure the game canvas is transparent
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
      canvas.style.backgroundColor = "transparent";
    }
  }
}

function clearAllTimers() {
  // Clear all setTimeout timers
  soundTimers.forEach(timerId => clearTimeout(timerId));
  soundTimers = [];
  
  // Clear the game interval timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
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
  // For game-related sounds, don't play if game isn't active
  if (!gameActive && ["enemyShoot", "shoot", "bomb", "explode"].includes(id)) {
    return;
  }
  
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

  // Reset game state completely
  clearAllTimers();
  gameRunning = false;
  gameActive = false;
  keys = {};

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
  
  // Reset form fields
  document.getElementById("regUsername").value = "";
  document.getElementById("regPassword").value = "";
  document.getElementById("verifyPassword").value = "";
  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("email").value = "";
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

  // Completely reset game state for the new user
  clearAllTimers();
  gameRunning = false;
  gameActive = false;
  keys = {};
  
  // Set current user and initialize score tracking
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
function setupColorSelection() {
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      config.playerColor = this.getAttribute('data-color');
      console.log("Selected color:", config.playerColor);
    });
  });
  config.playerColor = null;
}

// =====================
// Game Config
// =====================
function startConfiguredGame() {
  console.log("Current playerColor:", config.playerColor);
  
  if (!config.playerColor) {
    const configSection = document.getElementById("config");
    const errorMsg = document.createElement("p");
    errorMsg.className = "error-message";
    errorMsg.textContent = "Please select a spaceship color!";
    errorMsg.style.color = "#ff5555";
    errorMsg.style.fontWeight = "bold";
    errorMsg.style.marginTop = "10px";
    errorMsg.style.textAlign = "center";
    errorMsg.style.fontSize = "18px";
    const existingError = configSection.querySelector(".error-message");
    if (existingError) {
      configSection.removeChild(existingError);
    }
    configSection.appendChild(errorMsg);
    playSound("select");
    return;
  }
  
  clearAllTimers();
  gameRunning = false;
  gameActive = false;
  keys = {};
  
  shootKey = document.getElementById("shootKey").value;
  config.shootKey = shootKey;
  config.gameTime = Math.max(120, parseInt(document.getElementById("gameTime").value) * 60);
  playSound("start");
  initGame();
}

// =====================
// Game Setup
// =====================
function initGame() {
  // First, make sure all previous game resources are cleared
  clearAllTimers();
  gameRunning = false;
  gameActive = false;
  
  // Reset keyboard state
  keys = {};
  
  // Then initialize a fresh game state
  showScreen("game");
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
   
  playerImage = new Image();
 
  playerImage.src = `assets/images/${config.playerColor}.png`;
  
  enemyImage = new Image();
  enemyImage.src = "assets/images/invader.png";

  // Calculate the movement boundary (40% of bottom screen)
  movementBoundary = canvas.height * 0.6; 
  
  // Set player with consistent speed
  player = {
    x: canvas.width / 2 - 30,
    y: canvas.height * 0.9,  
    w: 60, h: 40,
    speed: PLAYER_BASE_SPEED
  };

  // Fresh game state
  bullets = [];
  enemyBullets = [];
  enemies = [];
  score = 0;
  lives = 3;
  timeLeft = config.gameTime;
  timeElapsed = 0;
  speedUps = 0;
  enemySpeed = INITIAL_ENEMY_SPEED;
  enemyDirection = 1;
  canShoot = true;
  enemyBulletDelay = true;
  
  // Create enemies
  createEnemies();
  
  // Set up timer and start game
  gameRunning = true;
  gameActive = true;
  setupTimer();
  updateUI();
  
  // Start game loop
  requestAnimationFrame(gameLoop);
}

function createEnemies() {
  // Create 20 enemies in a 4x5 formation
  const rows = 4, cols = 5, spacing = 80, startX = 300, startY = 80;
  
  // Define different colors for each row
  const rowColors = [
    "#ff0000", // Row 0 (top row) - 20 points - Red
    "#ffff00", // Row 1 - 15 points - Yellow
    "#00ff00", // Row 2 - 10 points - Green
    "#0099ff"  // Row 3 (bottom row) - 5 points - Blue
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
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    if (!gameRunning) return; // Skip if game is not running
    
    timeLeft--;
    timeElapsed++;
    
    // Speed up enemies every 5 seconds, max 4 times
    if (timeElapsed % 5 === 0 && speedUps < 4) {
      enemySpeed += 0.5; // Linear acceleration
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
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  
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
  if (!playerImage) {
    playerImage = new Image();
  }

  if (config.playerColor) {
    playerImage.src = `assets/images/${config.playerColor}.png`;
  } else {
    playerImage.src = "assets/images/red.png";
  }

  if (playerImage.complete) {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  } else {
    playerImage.onload = function() {
      ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
    };
  }
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
  // Use constant player speed (from global constant)
  let dx = 0, dy = 0;
  
  // Calculate movement direction
  if (keys["ArrowLeft"]) dx -= PLAYER_BASE_SPEED;
  if (keys["ArrowRight"]) dx += PLAYER_BASE_SPEED;
  if (keys["ArrowUp"]) dy -= PLAYER_BASE_SPEED;
  if (keys["ArrowDown"]) dy += PLAYER_BASE_SPEED;
  
  // Normalize diagonal movement to prevent faster diagonal speed
  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071; // Math.cos(45 degrees)
    dy *= 0.7071; // Math.sin(45 degrees)
  }
  
  // Apply movement with boundary checking
  const newX = player.x + dx;
  const newY = player.y + dy;
  
  // Check horizontal boundaries
  if (newX >= 0 && newX + player.w <= canvas.width) {
    player.x = newX;
  }
  
  // Check vertical boundaries (only allowing movement in bottom 40%)
  if (newY >= movementBoundary && newY + player.h <= canvas.height) {
    player.y = newY;
  }
  
  // Shooting - handle case insensitivity
  if ((keys[shootKey] || keys[shootKey.toLowerCase()] || keys[shootKey.toUpperCase()]) && canShoot) {
    shoot();
  }
}

function moveEnemies() {
  if (!gameRunning) return;
  
  let hitWall = false;
  
  // Calculate current speed (capped at reasonable maximum)
  const currentEnemySpeed = Math.min(enemySpeed, MAX_ENEMY_SPEED);
  
  // Check if any enemy hit a wall
  enemies.forEach(e => {
    if (e.alive) {
      if ((e.x + e.w + currentEnemySpeed * enemyDirection > canvas.width) || 
          (e.x + currentEnemySpeed * enemyDirection < 0)) {
        hitWall = true;
      }
    }
  });
  
  // Change direction if hit wall
  if (hitWall) enemyDirection *= -1;
  
  // Move all enemies at controlled speed
  enemies.forEach(e => { 
    if (e.alive) e.x += currentEnemySpeed * enemyDirection; 
  });
  
  // Enemy shooting logic
  if (enemyBulletDelay && gameRunning) {
    let aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      // Pick random enemy to shoot
      let shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      
      // Only allow new enemy bullet when previous one traveled 3/4 of screen
      let canEnemyShoot = true;
      if (enemyBullets.length > 0) {
        // Find the bullet that's traveled furthest down the screen
        let furthestBullet = enemyBullets.reduce((prev, current) => 
          (current.y > prev.y) ? current : prev, enemyBullets[0]);
          
        // Only allow new shot if furthest bullet passed 3/4 of screen
        canEnemyShoot = (furthestBullet.y / canvas.height) >= 0.75;
      }
      
      if (canEnemyShoot) {
        // Control bullet speed based on speedUps but cap it
        const bulletSpeed = Math.min(
          INITIAL_ENEMY_BULLET_SPEED + speedUps * 0.5,
          MAX_ENEMY_BULLET_SPEED
        );
        
        enemyBullets.push({ 
          x: shooter.x + shooter.w / 2, 
          y: shooter.y + shooter.h, 
          w: 4, h: 12, 
          speed: bulletSpeed
        });
        
        if (gameActive) {
          playSound("enemyShoot");
        }
        
        enemyBulletDelay = false;
        
        // Store the timer ID - adjust delay based on speedUps but ensure minimum time
        const rechargeTime = Math.max(800 - speedUps * 100, 400); // Minimum 400ms delay
        const timerId = setTimeout(() => {
          if (gameRunning) {
            enemyBulletDelay = true;
          }
        }, rechargeTime);
        soundTimers.push(timerId);
      }
    }
  }
}

function updateBullets() {
  // Move bullets
  bullets.forEach(b => b.y -= b.speed);
  enemyBullets.forEach(b => b.y += b.speed);
  
  // Remove bullets that are off-screen
  bullets = bullets.filter(b => b.y > 0);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
}

function shoot() {
  if (canShoot && gameRunning) {
    // Optional: Limit maximum bullets on screen
    if (MAX_PLAYER_BULLETS > 0 && bullets.length >= MAX_PLAYER_BULLETS) {
      return; // Don't allow more than MAX_PLAYER_BULLETS
    }
    
    bullets.push({ 
      x: player.x + player.w / 2 - 2, 
      y: player.y, 
      w: 4, h: 12,
      speed: PLAYER_BULLET_SPEED
    });
    
    if (gameActive) {
      playSound("shoot");
    }
    
    canShoot = false;
    
    // Store the timer ID with longer cooldown
    const timerId = setTimeout(() => {
      if (gameRunning) {
        canShoot = true;
      }
    }, PLAYER_SHOOT_COOLDOWN);
    soundTimers.push(timerId);
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
        
        if (gameActive) {
          playSound("explode");
        }
        
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
      player.y = canvas.height * 0.9;
      
      // Clear all enemy bullets
      enemyBullets = [];
      
      if (gameActive) {
        playSound("bomb");
      }
      
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
    gameActive = false;
    
    // Clear all timers
    clearAllTimers();
    
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
  gameActive = false;
  
  // Clear all timers
  clearAllTimers();

  // Stop all sounds including background music
  stopAllSounds();

  let message = "";
  if (reason === "death") {
    message = "You Lost!";
    playSound("gameOver"); // Use gameOver sound instead of bomb
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
  
  if (currentUser) {
    if (!userScores[currentUser]) userScores[currentUser] = [];
    userScores[currentUser].push(score);
    currentScore = score;
  }
  
  // Delay notification slightly to ensure game stops properly
  setTimeout(() => {
    showGameNotification(`${message}\nScore: ${score}`);
  }, 100);
}

function showHighScores() {
  const scores = userScores[currentUser] || [];
  const sorted = [...scores].sort((a, b) => b - a);
  const pos = sorted.indexOf(currentScore) + 1;
  
  let scoresText = "High Scores:\n";
  if (sorted.length === 0) {
    scoresText += "No scores yet";
  } else {
    scoresText += sorted.slice(0, 5).map((s, i) => `${i+1}. ${s}`).join("\n");
  }
  scoresText += `\n\nYour position: ${pos}`;

  showGameNotification(scoresText);
  setTimeout(() => {
    showScreen("welcome");
  }, 500);
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
  
  // Ensure complete reset of game state
  clearAllTimers();
  gameRunning = false;
  gameActive = false;
  keys = {};
  
  // Go to configuration screen
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

document.addEventListener('DOMContentLoaded', function() {
  // Initialize date dropdowns
  populateDateDropdowns();
  setupStarfield();
  
  setupColorSelection();
 
  clearAllTimers();
  stopAllSounds();
});

// =====================
// Restart & Game Over
// =====================
function restartGame() {
  // Clear all timers
  clearAllTimers();
  
  // Stop all sounds before restarting
  stopAllSounds();
  
  // Reset game state
  gameRunning = false;
  gameActive = false;
  keys = {};
  
  // Start a fresh game
  initGame();
}

function goToMainMenu() {
  // Clear all timers
  clearAllTimers();
  
  // Stop all sounds
  stopAllSounds();
  gameActive = false;
  
  showScreen("welcome");
}

// =====================
// Space Background with Particle Effects
// =====================
let stars = [];
const STAR_COUNT = 300;
let particleContainer;
let animationId = null;

function setupStarfield() {
  // Create particle container if it doesn't exist
  if (!document.getElementById('particles-container')) {
    particleContainer = document.createElement('div');
    particleContainer.id = 'particles-container';
    document.body.appendChild(particleContainer);
  } else {
    particleContainer = document.getElementById('particles-container');
  }
  
  // Clear existing stars
  particleContainer.innerHTML = '';
  stars = [];
  
  // Create stars
  for (let i = 0; i < STAR_COUNT; i++) {
    createStar();
  }
  
  // Start animation
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  animateStars();
}

function createStar() {
  const star = document.createElement('div');
  star.className = 'star';
  
  // Random position
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  
  // Random size (some stars bigger than others)
  const size = Math.random() * 2 + 1; // Reduce max size slightly for performance
  
  // Random opacity for twinkling effect
  const opacity = Math.random() * 0.5 + 0.3;
  
  // Random speed (slower stars appear further away)
  const speed = Math.random() * 0.2 + 0.1; // Slightly reduce speed range
  
  // Use transform instead of top/left
  star.style.transform = `translate(${x}px, ${y}px)`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.opacity = opacity;
  
  // Store star properties
  const starObj = {
    element: star,
    x: x,
    y: y,
    speed: speed
  };
  
  stars.push(starObj);
  particleContainer.appendChild(star);
}

function animateStars() {
  stars.forEach(star => {
    // Move star down
    star.y += star.speed;
    
    // Reset position if star moves off screen
    if (star.y > window.innerHeight) {
      star.y = -5;
      star.x = Math.random() * window.innerWidth;
    }
    
    // Update DOM element position
    star.element.style.top = `${star.y}px`;
  });
  
  // Continue animation
  animationId = requestAnimationFrame(animateStars);
}

// Set up the starfield when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize date dropdowns
  populateDateDropdowns();
  
  // Set up starfield
  setupStarfield();
  
  // Ensure the game starts in a clean state
  clearAllTimers();
  stopAllSounds();
});

// Update showScreen function to ensure particles continue 
// Override the existing showScreen function
const originalShowScreen = showScreen;
showScreen = function(id) {
  originalShowScreen(id);
  
  // If entering game mode, ensure particles are visible behind the game
  if (id === "game") {
    particleContainer.style.zIndex = "0";
  }
};

// Make sure stars are responsive to window resize
window.addEventListener('resize', function() {
  // Reset starfield when window is resized
  setupStarfield();
});
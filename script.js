function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }
  
  function closeAbout() {
    document.getElementById('about-modal').style.display = 'none';
  }
  
  document.querySelector('button[onclick*="about"]').addEventListener('click', () => {
    document.getElementById('about-modal').style.display = 'block';
  });
  
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('about-modal');
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
  
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAbout();
    }
  });
  
const users = [{ username: 'p', password: 'testuser'}];

function registerUser(data){
    //validate and push to users
}

function loginUser(username, password){
    const user = users.find(u => u.username === username && u.password ===password);
    return user !== undefined;
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function gameLoop(){
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);
    //update objects
    //draw objects
    requestAnimationFrame(gameLoop);
}
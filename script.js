function showScreen(id) {
    document.querySelectorAll('.screen').forEach(div => div.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
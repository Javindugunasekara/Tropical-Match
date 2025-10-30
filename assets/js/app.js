// Front-end game logic + localStorage login/register
document.addEventListener('DOMContentLoaded', () => {
  // Registration
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const pass = document.getElementById('signupPassword').value;
      localStorage.setItem('user', JSON.stringify({ name, email, pass }));
      alert('Account created successfully!');
      window.location.href = 'login.html';
    });
  }

  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.email === email && user.pass === pass) {
        localStorage.setItem('loggedIn', 'true');
        alert('Login successful!');
        window.location.href = 'index.html';
      } else {
        alert('Invalid email or password!');
      }
    });
  }

  // Profile
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  if (nameEl && emailEl) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    nameEl.textContent = user.name || 'Player';
    emailEl.textContent = user.email || 'player@example.com';
  }

  // Game
  const board = document.getElementById('board');
  const startBtn = document.getElementById('startBtn');
  const timerEl = document.getElementById('timer');
  const resultEl = document.getElementById('result');
  const back = document.getElementById('back');
  const levelSel = document.getElementById('level');

  if (board && startBtn) {
    let first = null, second = null, lock = false;
    let matches = 0, timeLeft = 30, interval;

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function makeBoard() {
      board.innerHTML = '';
      resultEl.textContent = '';
      const pairs = levelSel.value === 'hard' ? 8 : 6;
      const values = Array.from({ length: pairs }, (_, i) => i + 1).flatMap(v => [v, v]);
      shuffle(values);
      values.forEach(v => {
        const el = document.createElement('div');
        el.className = 'card-tile';
        el.textContent = '?';
        el.dataset.val = v;
        el.addEventListener('click', onClick);
        board.appendChild(el);
      });
      matches = 0;
    }

    function onClick(e) {
      if (lock) return;
      const el = e.currentTarget;
      if (el.classList.contains('matched') || el === first) return;
      el.textContent = el.dataset.val;
      if (!first) { first = el; return; }
      second = el; lock = true;
      if (first.dataset.val === second.dataset.val) {
        first.classList.add('matched'); second.classList.add('matched');
        matches++;
        first = null; second = null; lock = false;
        if (matches === board.children.length / 2) {
          clearInterval(interval);
          resultEl.textContent = '🎉 You Won!';
        }
      } else {
        setTimeout(() => {
          first.textContent = '?';
          second.textContent = '?';
          first = null; second = null; lock = false;
        }, 700);
      }
    }

    function startTimer() {
      clearInterval(interval);
      timeLeft = 30;
      timerEl.textContent = `⏱ ${timeLeft}s`;
      interval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(interval);
          resultEl.textContent = '⏰ Time Up!';
        }
      }, 1000);
    }

    startBtn.addEventListener('click', () => {
      makeBoard();
      startTimer();
    });

    back.addEventListener('click', () => window.location.href = 'index.html');
  }
});

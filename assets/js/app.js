// assets/js/app.js

// Change this if you want to use your Node proxy:
// const BANANA_API_URL = 'http://localhost:3000/banana';
const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php';

const STORAGE_KEYS = {
  CURRENT_GAME: 'bananaGameData',
  STATS: 'bananaGameStats'
};

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'game.html') {
    initGameStartPage();
  } else if (page === 'gamedashboard.html') {
    initGameDashboardPage();
  } else if (page === 'summary.html') {
    initSummaryPage();
  }
});

/* =========== HELPERS FOR STATS =========== */

function getStats() {
  const raw = localStorage.getItem(STORAGE_KEYS.STATS);
  if (!raw) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTime: null,
      lastScore: 0,
      lastTime: null
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return Object.assign(
      {
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: null,
        lastScore: 0,
        lastTime: null
      },
      parsed
    );
  } catch (e) {
    console.error('Error parsing stats from localStorage', e);
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTime: null,
      lastScore: 0,
      lastTime: null
    };
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

function updateStats({ correct, timeTaken, score }) {
  const stats = getStats();
  stats.gamesPlayed += 1;
  if (correct) stats.gamesWon += 1;

  if (stats.bestTime === null || timeTaken < stats.bestTime) {
    stats.bestTime = timeTaken;
  }

  stats.lastScore = score;
  stats.lastTime = timeTaken;

  saveStats(stats);
}

function calculateScore(level, timeTaken, correct) {
  if (!correct) return 0;

  const base = level === 'hard' ? 30 : 20;
  const timeBonus = Math.max(0, 20 - timeTaken); // more points if faster
  return base + timeBonus;
}

/* =========== PAGE: game.html (start page) =========== */

function initGameStartPage() {
  const levelSelect = document.getElementById('level');
  const startBtn = document.getElementById('startBtn');
  const resultEl = document.getElementById('result');

  if (!startBtn || !levelSelect) return;

  startBtn.addEventListener('click', async () => {
    const level = levelSelect.value || 'easy';
    startBtn.disabled = true;
    if (resultEl) resultEl.textContent = 'Loading puzzle...';

    try {
      const res = await fetch(BANANA_API_URL);
      if (!res.ok) throw new Error('API error');

      const apiData = await res.json();

      const gameData = {
        question: apiData.question,
        solution: parseInt(apiData.solution, 10),
        level,
        startedAt: Date.now()
      };

      localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, JSON.stringify(gameData));

      // go to puzzle page
      window.location.href = 'gamedashboard.html';
    } catch (err) {
      console.error(err);
      if (resultEl) {
        resultEl.textContent = 'Failed to start game. Please try again.';
      }
    } finally {
      startBtn.disabled = false;
    }
  });
}

/* =========== PAGE: gamedashboard.html (puzzle page) =========== */

function initGameDashboardPage() {
  const backBtn = document.getElementById('back');
  const refreshBtn = document.getElementById('refreshBtn');
  const board = document.getElementById('board');
  const gameDataDiv = document.getElementById('gameData');
  const answerBox = document.getElementById('answerBox');
  const resultEl = document.getElementById('result');

  // Back → dashboard
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  // Refresh → start a completely new game from game.html
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
      window.location.href = 'game.html';
    });
  }

  // Load current game
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
  if (!raw) {
    if (gameDataDiv) {
      gameDataDiv.textContent = 'No game data. Go back and press "Start Game".';
    }
    if (answerBox) answerBox.disabled = true;
    return;
  }

  let gameData;
  try {
    gameData = JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing game data', e);
    if (gameDataDiv) {
      gameDataDiv.textContent = 'Could not read saved puzzle data.';
    }
    return;
  }

  // Show puzzle image
  if (board && gameData.question) {
    board.innerHTML = '';
    const img = document.createElement('img');
    img.src = gameData.question;
    img.alt = 'Banana Puzzle';
    img.style.maxWidth = '350px';
    img.style.display = 'block';
    img.style.margin = '20px auto';
    board.appendChild(img);
  }

  if (gameDataDiv) {
    gameDataDiv.textContent = 'Enter the missing number in the box below.';
  }

  // Live timer
  const timerEl = document.createElement('div');
  timerEl.style.marginTop = '8px';
  if (gameDataDiv) gameDataDiv.appendChild(timerEl);

  const startTime = gameData.startedAt || Date.now();
  const timerId = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    timerEl.textContent = `Time: ${elapsed}s`;
  }, 1000);

  function finishGame(correct) {
    clearInterval(timerId);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const score = calculateScore(gameData.level || 'easy', timeTaken, correct);

    updateStats({ correct, timeTaken, score });

    if (resultEl) {
      if (correct) {
        resultEl.textContent = `✅ Correct! You scored ${score} points in ${timeTaken}s`;
      } else {
        resultEl.textContent = `❌ Incorrect. The correct answer was ${gameData.solution}.`;
      }
    }

    // small delay, then go to summary
    setTimeout(() => {
      window.location.href = 'summary.html';
    }, 2000);
  }

  // Answer input: press Enter to submit
  if (answerBox) {
    answerBox.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter') return;

      const value = answerBox.value.trim();
      if (!value) return;

      const userAnswer = parseInt(value, 10);
      if (Number.isNaN(userAnswer)) {
        if (resultEl) resultEl.textContent = 'Please enter a valid number.';
        return;
      }

      const correct = userAnswer === Number(gameData.solution);
      finishGame(correct);
    });
  }
}

/* =========== PAGE: summary.html (stats page) =========== */

function initSummaryPage() {
  const stats = getStats();

  const scoreEl = document.getElementById('score');
  const bestTimeEl = document.getElementById('bestTime');
  const playedEl = document.getElementById('playedTimes');
  const wonEl = document.getElementById('gamesWon');

  if (scoreEl) scoreEl.textContent = stats.lastScore ?? 0;
  if (bestTimeEl) {
    bestTimeEl.textContent =
      stats.bestTime !== null ? `${stats.bestTime}s` : '-';
  }
  if (playedEl) playedEl.textContent = stats.gamesPlayed ?? 0;
  if (wonEl) wonEl.textContent = stats.gamesWon ?? 0;
}

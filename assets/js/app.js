// assets/js/app.js

// Banana puzzle API
const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php';

const STORAGE_KEYS = {
  CURRENT_GAME: 'bananaGameData',
  STATS: 'bananaGameStats'
};

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop().toLowerCase();

  if (page === 'game.html') {
    initGameStartPage();
  } else if (page === 'gamedashboard.html') {
    initGameDashboardPage();
  } else if (page === 'summary.html') {
    initSummaryPage();
  }
});

/* LOCAL STATS HELPERS (fallback if not logged in)*/

function getLocalStats() {
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
    console.error('Error parsing local stats', e);
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTime: null,
      lastScore: 0,
      lastTime: null
    };
  }
}

function saveLocalStats(stats) {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

function updateLocalStats({ correct, timeTaken, score }) {
  const stats = getLocalStats();
  stats.gamesPlayed += 1;
  if (correct) stats.gamesWon += 1;

  if (correct) {
    if (stats.bestTime === null || timeTaken < stats.bestTime) {
      stats.bestTime = timeTaken;
    }
  }

  stats.lastScore = score;
  stats.lastTime = timeTaken;
  saveLocalStats(stats);
}

function calculateScore(level, timeTaken, correct) {
  if (!correct) return 0;
  const base = level === 'hard' ? 30 : 20;
  const timeBonus = Math.max(0, 20 - timeTaken);
  return base + timeBonus;
}

/* update_game_stats.php*/

function syncStatsToServer({ correct, timeTaken, score }) {
  const token = localStorage.getItem('userToken');
  if (!token) return; // not logged in, skip

  fetch('api/update_game_stats.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, correct, timeTaken, score })
  })
    .then(res => res.json())
    .then(data => {
      console.log('update_game_stats response:', data);
    })
    .catch(err => {
      console.error('Error calling update_game_stats.php:', err);
    });
}

/*game.html (start page)*/

function initGameStartPage() {
  const levelSelect = document.getElementById('level');
  const startBtn = document.getElementById('startBtn');
  const resultEl = document.getElementById('result');

  if (!startBtn || !levelSelect) return;

  startBtn.addEventListener('click', async () => {
    const level = levelSelect.value || 'easy';
    startBtn.disabled = true;
    if (resultEl) {
      resultEl.textContent = 'Loading puzzle...';
      resultEl.style.color = '#333';
    }

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

      window.location.href = 'gamedashboard.html';
    } catch (err) {
      console.error(err);
      if (resultEl) {
        resultEl.textContent = 'Failed to start game. Please try again.';
        resultEl.style.color = '#f44336';
      }
    } finally {
      startBtn.disabled = false;
    }
  });
}

/* gamedashboard.html (puzzle page)*/

function initGameDashboardPage() {
  const backBtn     = document.getElementById('back');
  const refreshBtn  = document.getElementById('refreshBtn');
  const submitBtn   = document.getElementById('submitAnswerBtn');
  const board       = document.getElementById('board');
  const gameDataDiv = document.getElementById('gameData');
  const answerBox   = document.getElementById('answerBox');
  const resultEl    = document.getElementById('result');

  // Back → dashboard
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  // Refresh  new game from game.html
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
      window.location.href = 'game.html';
    });
  }

  // Load game data from localStorage
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
  if (!raw) {
    if (gameDataDiv) {
      gameDataDiv.textContent = 'No game data. Go back and press "Start Game".';
    }
    if (answerBox) answerBox.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
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

  // Timer
  const timerEl = document.createElement('div');
  timerEl.id = 'timer';
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
    const level = gameData.level || 'easy';
    const score = calculateScore(level, timeTaken, correct);

    // local stats 
    updateLocalStats({ correct, timeTaken, score });

    // server stats for logged-in user
    syncStatsToServer({ correct, timeTaken, score });

    if (resultEl) {
      if (correct) {
        resultEl.textContent = `✅ Correct! You scored ${score} points in ${timeTaken}s`;
        resultEl.style.color = '#4caf50';
      } else {
        resultEl.textContent = `❌ Incorrect. The correct answer was ${gameData.solution}.`;
        resultEl.style.color = '#f44336';
      }
    }

    if (answerBox) answerBox.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      window.location.href = 'summary.html';
    }, 2500);
  }

  function handleAnswerSubmit() {
    if (!answerBox) return;

    const value = answerBox.value.trim();
    if (!value) {
      if (resultEl) {
        resultEl.textContent = 'Please enter your answer.';
        resultEl.style.color = '#f44336';
      }
      return;
    }

    const userAnswer = parseInt(value, 10);
    if (Number.isNaN(userAnswer)) {
      if (resultEl) {
        resultEl.textContent = 'Please enter a valid number.';
        resultEl.style.color = '#f44336';
      }
      return;
    }

    const correct = userAnswer === Number(gameData.solution);
    finishGame(correct);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAnswerSubmit();
    });
  }

  if (answerBox) {
    answerBox.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        handleAnswerSubmit();
      }
    });
  }
}

/*summary.html (stats page)*/

function initSummaryPage() {
  const scoreEl    = document.getElementById('score');
  const bestTimeEl = document.getElementById('bestTime');
  const playedEl   = document.getElementById('playedTimes');
  const wonEl      = document.getElementById('gamesWon');

  function renderStats(stats) {
    if (scoreEl)    scoreEl.textContent    = stats.lastScore ?? 0;
    if (bestTimeEl) bestTimeEl.textContent =
      stats.bestTime === null || stats.bestTime === 0
        ? '-'
        : `${stats.bestTime}s`;
    if (playedEl)   playedEl.textContent   = stats.gamesPlayed ?? 0;
    if (wonEl)      wonEl.textContent      = stats.gamesWon ?? 0;
  }

  const token = localStorage.getItem('userToken');

  if (!token) {
    // Guest  show local stats only
    const localStats = getLocalStats();
    renderStats(localStats);
    return;
  }

  // Logged-in  get stats from get_game_stats.php
  fetch('api/get_game_stats.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
    .then(res => res.json())
    .then(data => {
      console.log('get_game_stats response:', data);
      if (data.success && data.stats) {
        const s = data.stats;
        const stats = {
          gamesPlayed: s.games_played,
          gamesWon: s.games_won,
          bestTime: s.best_time === null ? null : s.best_time,
          lastScore: s.last_score,
          lastTime: s.last_time === null ? null : s.last_time
        };
        renderStats(stats);
      } else {
        // fallback to local
        renderStats(getLocalStats());
      }
    })
    .catch(err => {
      console.error('Error calling get_game_stats.php:', err);
      renderStats(getLocalStats());
    });
}

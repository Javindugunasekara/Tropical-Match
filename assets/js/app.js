document.addEventListener('DOMContentLoaded', () => {

  // -----------------------------
  // READ LEVEL FROM QUERY PARAMS
  // -----------------------------
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level') || 'easy'; // default to easy

  // START GAME
  const startBtn = document.getElementById('startBtn');
  const board = document.getElementById('board');

  if (startBtn && board) {
    startBtn.addEventListener('click', async () => {
      board.innerHTML = ''; // clear previous board

      try {
        const response = await fetch('https://marcconrad.com/uob/banana/');
        const bananas = await response.json();

        const numPairs = level === 'easy' ? 6 : 12;
        const selectedBananas = bananas.slice(0, numPairs);
        const cards = [...selectedBananas, ...selectedBananas];
        shuffleArray(cards);

        cards.forEach(banana => {
          const card = document.createElement('div');
          card.className = 'card';
          card.dataset.id = banana.id;
          card.innerHTML = `
            <div class="card-inner">
              <div class="card-front">❓</div>
              <div class="card-back"><img src="${banana.url}" alt="Banana"></div>
            </div>
          `;
          board.appendChild(card);
        });

        startTimer(level === 'easy' ? 30 : 60);
        addCardFlipLogic();

      } catch (err) {
        console.error('Error fetching bananas:', err);
        board.innerHTML = '<p>Failed to load game. Try again.</p>';
      }
    });
  }

  // BACK BUTTON
  const backBtn = document.getElementById('back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      board.innerHTML = '';
      const timerEl = document.getElementById('timer');
      if (timerEl) timerEl.textContent = '';
      window.location.href = 'gamedashboard.html?level=' + level;
    });
  }

  // -----------------------------
  // SHUFFLE FUNCTION
  // -----------------------------
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // -----------------------------
  // TIMER FUNCTION
  // -----------------------------
  function startTimer(seconds) {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    let timeLeft = seconds;
    timerEl.textContent = `⏱ ${timeLeft}s`;

    const timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `⏱ ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert('Time’s up!');
      }
    }, 1000);
  }

  // -----------------------------
  // FLIP & MATCH LOGIC
  // -----------------------------
  function addCardFlipLogic() {
    const cards = document.querySelectorAll('.card');
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (lockBoard || card === firstCard) return;

        card.classList.add('flip');

        if (!firstCard) {
          firstCard = card;
          return;
        }

        secondCard = card;
        lockBoard = true;

        if (firstCard.dataset.id === secondCard.dataset.id) {
          firstCard = null;
          secondCard = null;
          lockBoard = false;
        } else {
          setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            firstCard = null;
            secondCard = null;
            lockBoard = false;
          }, 1000);
        }
      });
    });
  }

});

const questionText = document.querySelector("#question-text");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const feedback = document.querySelector("#feedback");
const sessionPennies = document.querySelector("#session-pennies");
const availablePennies = document.querySelector("#available-pennies");
const availableDollars = document.querySelector("#available-dollars");
const dollarTotal = document.querySelector("#dollar-total");
const topAvailablePennies = document.querySelector("#top-available-pennies");
const topTodayEarned = document.querySelector("#top-today-earned");
const topBestStreak = document.querySelector("#top-best-streak");
const totalRedeemed = document.querySelector("#total-redeemed");
const todayCorrect = document.querySelector("#today-correct");
const todayMistakes = document.querySelector("#today-mistakes");
const todayEarned = document.querySelector("#today-earned");
const bestStreak = document.querySelector("#best-streak");
const reportDate = document.querySelector("#report-date");
const historyList = document.querySelector("#history-list");
const backupStatus = document.querySelector("#backup-status");
const rewardPreview = document.querySelector("#reward-preview");
const coinJar = document.querySelector("#coin-jar");
const coinTemplate = document.querySelector("#coin-template");
const progressFill = document.querySelector("#progress-fill");
const roundLabel = document.querySelector("#round-label");
const streakLabel = document.querySelector("#streak-label");
const timerLabel = document.querySelector("#timer-label");
const timerFill = document.querySelector("#timer-fill");
const hintButton = document.querySelector("#hint-button");
const skipButton = document.querySelector("#skip-button");
const redeemButton = document.querySelector("#redeem-button");
const redeemAllButton = document.querySelector("#redeem-all-button");
const redeemDollars = document.querySelector("#redeem-dollars");
const soundToggle = document.querySelector("#sound-toggle");
const exportButton = document.querySelector("#export-button");
const importInput = document.querySelector("#import-input");
const levelButtons = document.querySelectorAll(".level-button");

const PENNIES_PER_DOLLAR = 250;
const QUESTION_SECONDS = 30;
const QUICK_SECONDS = 10;
const QUICK_BONUS = 2;
const STORAGE_KEY = "familyLearning.harshith.v1";
const todayKey = new Date().toISOString().slice(0, 10);

const difficultySettings = {
  easy: { label: "Easy", base: 1, makers: ["addition", "subtraction", "tenMoreLess"] },
  medium: { label: "Medium", base: 2, makers: ["twoStep", "multiplication", "wordAddition"] },
  hard: { label: "Hard", base: 4, makers: ["hardMultiplication", "division", "wordMultiplication", "mixedOperation"] },
};

const state = {
  user: "harshith",
  difficulty: "easy",
  sessionPennies: 0,
  round: 1,
  streak: 0,
  current: null,
  answered: false,
  timeLeft: QUESTION_SECONDS,
  timerId: null,
  questionStartedAt: Date.now(),
  soundOn: false,
  audioContext: null,
  profile: loadProfile(),
};

const praise = [
  "Sharp work!",
  "Correct. That streak is getting stronger.",
  "Nice focus. Pennies added.",
  "Great answer. Keep the sequence going.",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function loadProfile() {
  const fallback = {
    availablePennies: 0,
    totalEarnedPennies: 0,
    totalRedeemedPennies: 0,
    daily: {},
  };

  try {
    const saved = { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    if (typeof saved.lifetimePennies === "number" && saved.availablePennies === 0) {
      saved.availablePennies = saved.lifetimePennies;
      saved.totalEarnedPennies = Math.max(saved.totalEarnedPennies, saved.lifetimePennies);
      delete saved.lifetimePennies;
    }
    return saved;
  } catch {
    return fallback;
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
  backupStatus.textContent = "Saved in this browser automatically.";
}

function getToday() {
  if (!state.profile.daily[todayKey]) {
    state.profile.daily[todayKey] = {
      correct: 0,
      mistakes: 0,
      earned: 0,
      bestStreak: 0,
    };
  }
  return state.profile.daily[todayKey];
}

function makeQuestion() {
  const makers = difficultySettings[state.difficulty].makers;
  const makerName = makers[rand(0, makers.length - 1)];
  return questionMakers[makerName]();
}

const questionMakers = {
  addition() {
    const top = state.difficulty === "easy" ? 80 : 200;
    const a = rand(12, top);
    const b = rand(8, top);
    return {
      text: `${a} + ${b} = ?`,
      answer: a + b,
      hint: `Break apart the second number: add tens first, then ones.`,
    };
  },

  subtraction() {
    const answer = rand(12, 140);
    const b = rand(8, state.difficulty === "easy" ? 45 : 95);
    const a = answer + b;
    return {
      text: `${a} - ${b} = ?`,
      answer,
      hint: `Think: what number plus ${b} gets back to ${a}?`,
    };
  },

  tenMoreLess() {
    const base = rand(24, 176);
    const step = [10, 20, 30][rand(0, 2)];
    const more = Math.random() > 0.5;
    return {
      text: `What is ${step} ${more ? "more" : "less"} than ${base}?`,
      answer: more ? base + step : base - step,
      hint: `Only the tens place needs to move by ${step}.`,
      word: true,
    };
  },

  twoStep() {
    const a = rand(20, 90);
    const b = rand(10, 60);
    const c = rand(5, 35);
    return {
      text: `${a} + ${b} - ${c} = ?`,
      answer: a + b - c,
      hint: `Do ${a} + ${b} first, then subtract ${c}.`,
    };
  },

  multiplication() {
    const a = rand(3, 10);
    const b = rand(3, 10);
    return {
      text: `${a} x ${b} = ?`,
      answer: a * b,
      hint: `Use skip counting or a fact you already know nearby.`,
    };
  },

  hardMultiplication() {
    const a = rand(6, 12);
    const b = rand(4, 12);
    return {
      text: `${a} x ${b} = ?`,
      answer: a * b,
      hint: `Break ${b} into smaller parts, then add the partial products.`,
    };
  },

  division() {
    const divisor = rand(2, 10);
    const answer = rand(3, 12);
    const total = divisor * answer;
    return {
      text: `${total} ÷ ${divisor} = ?`,
      answer,
      hint: `Ask: ${divisor} times what number equals ${total}?`,
    };
  },

  mixedOperation() {
    const a = rand(4, 9);
    const b = rand(3, 8);
    const c = rand(12, 48);
    return {
      text: `${a} x ${b} + ${c} = ?`,
      answer: a * b + c,
      hint: `Multiply first, then add ${c}.`,
    };
  },

  wordAddition() {
    const a = rand(28, 95);
    const b = rand(18, 85);
    const c = rand(6, 32);
    return {
      text: `Harshith reads ${a} pages, then ${b} pages, then rereads ${c}. How many pages did he read total?`,
      answer: a + b + c,
      hint: `Total means add all three numbers.`,
      word: true,
    };
  },

  wordMultiplication() {
    const groups = rand(4, 9);
    const perGroup = rand(6, 12);
    return {
      text: `There are ${groups} boxes with ${perGroup} cards in each box. How many cards are there?`,
      answer: groups * perGroup,
      hint: `${groups} equal groups of ${perGroup} means multiply.`,
      word: true,
    };
  },
};

function streakBonus() {
  if (state.streak >= 20) return 4;
  if (state.streak >= 10) return 3;
  if (state.streak >= 5) return 2;
  if (state.streak >= 3) return 1;
  return 0;
}

function nextReward() {
  return difficultySettings[state.difficulty].base + streakBonus();
}

function showQuestion() {
  stopTimer();
  state.current = makeQuestion();
  state.answered = false;
  state.timeLeft = QUESTION_SECONDS;
  state.questionStartedAt = Date.now();
  questionText.textContent = state.current.text;
  questionText.classList.toggle("word-problem", Boolean(state.current.word));
  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.focus();
  feedback.textContent = "";
  feedback.className = "feedback";
  updateStats();
  startTimer();
}

function checkAnswer(event) {
  event.preventDefault();
  if (state.answered) {
    showQuestion();
    return;
  }

  const rawAnswer = answerInput.value.trim();
  const guess = Number(rawAnswer);
  if (rawAnswer === "" || !Number.isFinite(guess)) {
    setFeedback("Type a number first.", "try");
    return;
  }

  if (guess === state.current.answer) {
    handleCorrect();
  } else {
    handleMistake();
  }
}

function handleCorrect() {
  stopTimer();
  const secondsUsed = Math.floor((Date.now() - state.questionStartedAt) / 1000);
  const speedBonus = secondsUsed <= QUICK_SECONDS ? QUICK_BONUS : 0;
  const earned = nextReward() + speedBonus;
  const today = getToday();

  state.answered = true;
  state.sessionPennies += earned;
  state.profile.availablePennies += earned;
  state.profile.totalEarnedPennies += earned;
  state.streak += 1;
  state.round += 1;
  today.correct += 1;
  today.earned += earned;
  today.bestStreak = Math.max(today.bestStreak, state.streak);

  saveProfile();
  setFeedback(`${praise[rand(0, praise.length - 1)]} +${earned} pennies${speedBonus ? " with speed bonus." : "."}`, "good");
  animateRewardChange(speedBonus ? `+${earned} fast` : `+${earned}`);
  playSound(speedBonus ? "fast" : "correct");
  drawJar();
  updateStats();
  answerInput.disabled = true;
  window.setTimeout(showQuestion, 950);
}

function handleMistake() {
  stopTimer();
  const today = getToday();
  const penalty = state.sessionPennies > 0 || state.profile.availablePennies > 0 ? 1 : 0;

  state.sessionPennies = Math.max(0, state.sessionPennies - penalty);
  state.profile.availablePennies = Math.max(0, state.profile.availablePennies - penalty);
  state.streak = 0;
  today.mistakes += 1;
  today.earned = Math.max(0, today.earned - penalty);

  saveProfile();
  drawJar();
  updateStats();
  setFeedback(`Not yet. -${penalty} penny from the jar. Try again carefully.`, "try");
  animateRewardChange(penalty ? "-1" : "0");
  playSound("wrong");
  answerInput.select();
  startTimer();
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function updateStats() {
  const today = getToday();
  const dollars = state.profile.availablePennies / PENNIES_PER_DOLLAR;
  const redeemedDollars = state.profile.totalRedeemedPennies / PENNIES_PER_DOLLAR;
  const reward = nextReward();
  const setting = difficultySettings[state.difficulty];

  sessionPennies.textContent = `${state.sessionPennies}p`;
  availablePennies.textContent = state.profile.availablePennies;
  availableDollars.textContent = `$${dollars.toFixed(2)}`;
  dollarTotal.textContent = `$${dollars.toFixed(2)}`;
  topAvailablePennies.textContent = state.profile.availablePennies;
  topTodayEarned.textContent = `${today.earned}p`;
  topBestStreak.textContent = today.bestStreak;
  totalRedeemed.textContent = `$${redeemedDollars.toFixed(2)}`;
  todayCorrect.textContent = today.correct;
  todayMistakes.textContent = today.mistakes;
  todayEarned.textContent = `${today.earned}p`;
  bestStreak.textContent = today.bestStreak;
  reportDate.textContent = new Date(`${todayKey}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  roundLabel.textContent = `Question ${state.round}`;
  streakLabel.textContent = `Streak: ${state.streak}`;
  rewardPreview.textContent = `Next correct answer: +${reward} ${reward === 1 ? "penny" : "pennies"} (${setting.label}); quick answer adds +${QUICK_BONUS}`;
  progressFill.style.width = `${((state.profile.availablePennies % PENNIES_PER_DOLLAR) / PENNIES_PER_DOLLAR) * 100}%`;
  redeemButton.disabled = state.profile.availablePennies === 0;
  redeemAllButton.disabled = state.profile.availablePennies === 0;
  redeemDollars.max = (state.profile.availablePennies / PENNIES_PER_DOLLAR).toFixed(2);
  renderHistory();
}

function startTimer() {
  updateTimerDisplay();
  state.timerId = window.setInterval(() => {
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    updateTimerDisplay();
    if (state.timeLeft === 0) {
      stopTimer();
      state.round += 1;
      state.streak = 0;
      updateStats();
      setFeedback("Time is up. No penny lost, but the streak resets.", "try");
      window.setTimeout(showQuestion, 1000);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerDisplay() {
  const percent = (state.timeLeft / QUESTION_SECONDS) * 100;
  timerLabel.textContent = `${state.timeLeft}s`;
  timerFill.style.width = `${percent}%`;
  timerLabel.classList.toggle("is-low", state.timeLeft <= 8);
  timerFill.classList.toggle("is-low", state.timeLeft <= 8);
}

function animateRewardChange(label) {
  const pop = document.createElement("span");
  pop.className = "reward-pop";
  pop.textContent = label;
  coinJar.appendChild(pop);
  window.setTimeout(() => pop.remove(), 900);
}

function drawJar() {
  coinJar.querySelectorAll(".coin").forEach((coin) => coin.remove());
  const jarCoins = Math.min(40, state.profile.availablePennies % PENNIES_PER_DOLLAR);

  for (let index = 0; index < jarCoins; index += 1) {
    const coin = coinTemplate.content.firstElementChild.cloneNode(true);
    const column = index % 8;
    const row = Math.floor(index / 8);
    coin.style.left = `${12 + column * 22}px`;
    coin.style.bottom = `${8 + row * 24}px`;
    coinJar.appendChild(coin);
  }
}

function redeemReward(redeemAll = false) {
  if (state.profile.availablePennies === 0) {
    setFeedback("No pennies to redeem yet. Build the balance first.", "try");
    return;
  }

  const requestedDollars = redeemAll ? state.profile.availablePennies / PENNIES_PER_DOLLAR : Number(redeemDollars.value);
  if (!redeemAll && (!Number.isFinite(requestedDollars) || requestedDollars <= 0)) {
    setFeedback("Enter a dollar amount to redeem.", "try");
    redeemDollars.focus();
    return;
  }

  const requestedPennies = Math.round(requestedDollars * PENNIES_PER_DOLLAR);
  const redeemed = Math.min(state.profile.availablePennies, requestedPennies);
  if (redeemed <= 0) {
    setFeedback("That amount is too small to redeem.", "try");
    return;
  }

  state.profile.totalRedeemedPennies += redeemed;
  state.profile.availablePennies = Math.max(0, state.profile.availablePennies - redeemed);
  state.sessionPennies = Math.max(0, state.sessionPennies - redeemed);
  state.streak = 0;
  redeemDollars.value = "";
  saveProfile();
  drawJar();
  updateStats();
  playSound("redeem");
  setFeedback(`Redeemed $${(redeemed / PENNIES_PER_DOLLAR).toFixed(2)}. Remaining balance: $${(state.profile.availablePennies / PENNIES_PER_DOLLAR).toFixed(2)}.`, "good");
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "Sound on" : "Sound off";
  soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  if (state.soundOn) {
    ensureAudioContext();
    playSound("toggle");
  }
}

function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
}

function playSound(type) {
  if (!state.soundOn) return;
  ensureAudioContext();

  const patterns = {
    correct: [660, 880],
    fast: [880, 1175, 1320],
    wrong: [220, 165],
    redeem: [523, 659, 784, 1046],
    toggle: [440],
  };
  const notes = patterns[type] ?? patterns.correct;
  notes.forEach((frequency, index) => {
    const start = state.audioContext.currentTime + index * 0.075;
    const oscillator = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    oscillator.type = type === "wrong" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    oscillator.connect(gain);
    gain.connect(state.audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });
}

function renderHistory() {
  const days = Object.entries(state.profile.daily)
    .sort(([first], [second]) => second.localeCompare(first))
    .slice(0, 7);

  if (days.length === 0) {
    historyList.innerHTML = `<p class="empty-history">No practice yet.</p>`;
    return;
  }

  historyList.innerHTML = days.map(([date, day]) => {
    const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return `
      <div class="history-item">
        <strong>${label}</strong>
        <span>${day.correct} correct</span>
        <span>${day.mistakes} misses</span>
        <span>${day.earned}p</span>
      </div>
    `;
  }).join("");
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    learner: state.user,
    penniesPerDollar: PENNIES_PER_DOLLAR,
    profile: state.profile,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `family-learning-harshith-${todayKey}.json`;
  link.click();
  URL.revokeObjectURL(url);
  backupStatus.textContent = "Backup JSON downloaded.";
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const importedProfile = parsed.profile ?? parsed;
      if (!importedProfile.daily || typeof importedProfile.availablePennies !== "number") {
        throw new Error("Invalid backup file");
      }
      state.profile = {
        availablePennies: 0,
        totalEarnedPennies: 0,
        totalRedeemedPennies: 0,
        daily: {},
        ...importedProfile,
      };
      state.sessionPennies = 0;
      state.streak = 0;
      saveProfile();
      drawJar();
      updateStats();
      backupStatus.textContent = "Backup restored successfully.";
      setFeedback("Data restored. Harshith's balance is back.", "good");
    } catch {
      backupStatus.textContent = "That file does not look like a Family_Learning backup.";
    } finally {
      importInput.value = "";
    }
  });
  reader.readAsText(file);
}

hintButton.addEventListener("click", () => {
  setFeedback(state.current.hint, "try");
  answerInput.focus();
});

skipButton.addEventListener("click", () => {
  stopTimer();
  state.round += 1;
  state.streak = 0;
  setFeedback("Skipped. No reward, no penalty.", "try");
  showQuestion();
});

redeemButton.addEventListener("click", () => redeemReward(false));
redeemAllButton.addEventListener("click", () => redeemReward(true));
soundToggle.addEventListener("click", toggleSound);
exportButton.addEventListener("click", exportData);
importInput.addEventListener("change", importData);

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.difficulty = button.dataset.difficulty;
    state.streak = 0;
    levelButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    showQuestion();
  });
});

answerForm.addEventListener("submit", checkAnswer);

getToday();
drawJar();
showQuestion();

const questionText = document.querySelector("#question-text");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const feedback = document.querySelector("#feedback");
const sessionPennies = document.querySelector("#session-pennies");
const lifetimePennies = document.querySelector("#lifetime-pennies");
const dollarTotal = document.querySelector("#dollar-total");
const todayCorrect = document.querySelector("#today-correct");
const todayMistakes = document.querySelector("#today-mistakes");
const todayEarned = document.querySelector("#today-earned");
const bestStreak = document.querySelector("#best-streak");
const rewardPreview = document.querySelector("#reward-preview");
const coinJar = document.querySelector("#coin-jar");
const coinTemplate = document.querySelector("#coin-template");
const progressFill = document.querySelector("#progress-fill");
const roundLabel = document.querySelector("#round-label");
const streakLabel = document.querySelector("#streak-label");
const hintButton = document.querySelector("#hint-button");
const nextButton = document.querySelector("#next-button");
const levelButtons = document.querySelectorAll(".level-button");

const PENNIES_PER_DOLLAR = 250;
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
    lifetimePennies: 0,
    daily: {},
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return fallback;
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
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
  state.current = makeQuestion();
  state.answered = false;
  questionText.textContent = state.current.text;
  questionText.classList.toggle("word-problem", Boolean(state.current.word));
  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.focus();
  feedback.textContent = "";
  feedback.className = "feedback";
  updateStats();
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
  const earned = nextReward();
  const today = getToday();

  state.answered = true;
  state.sessionPennies += earned;
  state.profile.lifetimePennies += earned;
  state.streak += 1;
  state.round += 1;
  today.correct += 1;
  today.earned += earned;
  today.bestStreak = Math.max(today.bestStreak, state.streak);

  saveProfile();
  setFeedback(`${praise[rand(0, praise.length - 1)]} +${earned} pennies.`, "good");
  drawJar();
  updateStats();
  answerInput.disabled = true;
  window.setTimeout(showQuestion, 950);
}

function handleMistake() {
  const today = getToday();
  const penalty = state.sessionPennies > 0 || state.profile.lifetimePennies > 0 ? 1 : 0;

  state.sessionPennies = Math.max(0, state.sessionPennies - penalty);
  state.profile.lifetimePennies = Math.max(0, state.profile.lifetimePennies - penalty);
  state.streak = 0;
  today.mistakes += 1;
  today.earned = Math.max(0, today.earned - penalty);

  saveProfile();
  drawJar();
  updateStats();
  setFeedback(`Not yet. -${penalty} penny from the jar. Try again carefully.`, "try");
  answerInput.select();
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function updateStats() {
  const today = getToday();
  const dollars = state.profile.lifetimePennies / PENNIES_PER_DOLLAR;
  const reward = nextReward();
  const setting = difficultySettings[state.difficulty];

  sessionPennies.textContent = `${state.sessionPennies}p`;
  lifetimePennies.textContent = state.profile.lifetimePennies;
  dollarTotal.textContent = `$${dollars.toFixed(2)}`;
  todayCorrect.textContent = today.correct;
  todayMistakes.textContent = today.mistakes;
  todayEarned.textContent = `${today.earned}p`;
  bestStreak.textContent = today.bestStreak;
  roundLabel.textContent = `Question ${state.round}`;
  streakLabel.textContent = `Streak: ${state.streak}`;
  rewardPreview.textContent = `Next correct answer: +${reward} ${reward === 1 ? "penny" : "pennies"} (${setting.label})`;
  progressFill.style.width = `${((state.profile.lifetimePennies % PENNIES_PER_DOLLAR) / PENNIES_PER_DOLLAR) * 100}%`;
}

function drawJar() {
  coinJar.querySelectorAll(".coin").forEach((coin) => coin.remove());
  const jarCoins = Math.min(40, state.profile.lifetimePennies % PENNIES_PER_DOLLAR);

  for (let index = 0; index < jarCoins; index += 1) {
    const coin = coinTemplate.content.firstElementChild.cloneNode(true);
    const column = index % 8;
    const row = Math.floor(index / 8);
    coin.style.left = `${12 + column * 22}px`;
    coin.style.bottom = `${8 + row * 24}px`;
    coinJar.appendChild(coin);
  }
}

hintButton.addEventListener("click", () => {
  setFeedback(state.current.hint, "try");
  answerInput.focus();
});

nextButton.addEventListener("click", () => {
  state.round += 1;
  state.streak = 0;
  showQuestion();
});

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

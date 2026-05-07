const questionText = document.querySelector("#question-text");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const feedback = document.querySelector("#feedback");
const coinCount = document.querySelector("#coin-count");
const coinJar = document.querySelector("#coin-jar");
const coinTemplate = document.querySelector("#coin-template");
const progressFill = document.querySelector("#progress-fill");
const roundLabel = document.querySelector("#round-label");
const streakLabel = document.querySelector("#streak-label");
const hintButton = document.querySelector("#hint-button");
const nextButton = document.querySelector("#next-button");
const levelButtons = document.querySelectorAll(".level-button");

const state = {
  grade: 2,
  coins: 0,
  round: 1,
  streak: 0,
  current: null,
  answered: false,
};

const praise = [
  "Nice work! A penny for the jar.",
  "You got it! Clink, another penny.",
  "Great thinking! Your jar is growing.",
  "Correct! That penny was well earned.",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeQuestion() {
  const makers = state.grade === 2
    ? [addition, subtraction, tenMoreLess, wordAddition]
    : [addition, subtraction, multiplication, wordMultiplication];
  return makers[rand(0, makers.length - 1)]();
}

function addition() {
  const top = state.grade === 2 ? 50 : 100;
  const a = rand(4, top);
  const b = rand(3, top);
  return {
    text: `${a} + ${b} = ?`,
    answer: a + b,
    hint: `Start with ${a}, then count up ${b} more.`,
  };
}

function subtraction() {
  const top = state.grade === 2 ? 50 : 100;
  const answer = rand(2, top - 12);
  const b = rand(2, state.grade === 2 ? 18 : 40);
  const a = answer + b;
  return {
    text: `${a} - ${b} = ?`,
    answer,
    hint: `Think: what number plus ${b} makes ${a}?`,
  };
}

function tenMoreLess() {
  const base = rand(10, 89);
  const more = Math.random() > 0.5;
  return {
    text: `What is 10 ${more ? "more" : "less"} than ${base}?`,
    answer: more ? base + 10 : base - 10,
    hint: `Only the tens place changes.`,
    word: true,
  };
}

function multiplication() {
  const a = rand(2, 10);
  const b = rand(2, 10);
  return {
    text: `${a} x ${b} = ?`,
    answer: a * b,
    hint: `Add ${a} together ${b} times, or skip-count by ${a}.`,
  };
}

function wordAddition() {
  const a = rand(8, 35);
  const b = rand(5, 28);
  return {
    text: `Mia has ${a} stickers and finds ${b} more. How many stickers does she have?`,
    answer: a + b,
    hint: `Finding more means add: ${a} + ${b}.`,
    word: true,
  };
}

function wordMultiplication() {
  const groups = rand(2, 6);
  const perGroup = rand(3, 9);
  return {
    text: `There are ${groups} bags with ${perGroup} marbles in each bag. How many marbles are there?`,
    answer: groups * perGroup,
    hint: `${groups} equal groups of ${perGroup} means multiply.`,
    word: true,
  };
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
  roundLabel.textContent = `Question ${state.round}`;
  streakLabel.textContent = `Streak: ${state.streak}`;
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
    state.answered = true;
    state.coins += 1;
    state.streak += 1;
    state.round += 1;
    setFeedback(praise[rand(0, praise.length - 1)], "good");
    updateRewards();
    answerInput.disabled = true;
    window.setTimeout(showQuestion, 900);
  } else {
    state.streak = 0;
    streakLabel.textContent = "Streak: 0";
    setFeedback("Almost. Try once more.", "try");
    answerInput.select();
  }
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function updateRewards() {
  coinCount.textContent = state.coins;
  const jarSlot = (state.coins - 1) % 10;
  progressFill.style.width = `${(jarSlot + 1) * 10}%`;

  const coin = coinTemplate.content.firstElementChild.cloneNode(true);
  const column = jarSlot % 5;
  const row = Math.floor(jarSlot / 5);
  coin.style.left = `${18 + column * 33}px`;
  coin.style.bottom = `${10 + row * 30}px`;
  coinJar.appendChild(coin);

  if (state.coins > 0 && state.coins % 10 === 0) {
    setFeedback("Jar filled! Keep going for another 10 pennies.", "good");
    window.setTimeout(resetJar, 850);
  }
}

function resetJar() {
  coinJar.querySelectorAll(".coin").forEach((coin) => coin.remove());
  progressFill.style.width = "0%";
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
    state.grade = Number(button.dataset.level);
    state.round = 1;
    state.streak = 0;
    levelButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    showQuestion();
  });
});

answerForm.addEventListener("submit", checkAnswer);

showQuestion();

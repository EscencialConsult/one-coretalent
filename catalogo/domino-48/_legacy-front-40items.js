import { URL_TEST5 } from '../../js/config/constants.js';
import { incrementCountAndRenderRetry,getStoredEmail } from '../../js/helpers/finalActions.js';

(function guard() {
  const logged = localStorage.getItem('sessionLoggedIn') === '1';
  // if (!logged) {
  //   window.location.href = '../../evaluaciones.html';
  // }
})();

// ========================
// CONFIGURACIÓN
// ========================
const TOTAL_ITEMS = 40;
const MAX_TIME_SECONDS = 25 * 60; // 25 minutos

// ✅ Usar constante centralizada
const SAVE_RESULTS_URL = URL_TEST5;

// ========================
// ÍTEMS
// ========================
const ITEMS = [
  // ----- BLOQUE A: 1–10 (básico) -----
  { sequence: [[0, 0], [1, 1], [2, 2]], answer: [3, 3], options: [[3, 3], [3, 2], [2, 3], [4, 4], [1, 3], [0, 2]] },
  { sequence: [[1, 2], [2, 3], [3, 4]], answer: [4, 5], options: [[4, 5], [5, 4], [3, 5], [5, 6], [4, 4], [2, 4]] },
  { sequence: [[6, 6], [5, 5], [4, 4]], answer: [3, 3], options: [[3, 3], [2, 2], [4, 3], [3, 4], [2, 3], [6, 5]] },
  { sequence: [[0, 1], [1, 2], [2, 3]], answer: [3, 4], options: [[3, 4], [4, 5], [4, 3], [2, 4], [1, 3], [3, 3]] },
  { sequence: [[0, 6], [1, 5], [2, 4]], answer: [3, 3], options: [[3, 3], [4, 2], [5, 1], [2, 3], [3, 4], [0, 3]] },
  { sequence: [[0, 0], [1, 0], [2, 0]], answer: [3, 0], options: [[3, 0], [4, 0], [3, 1], [2, 1], [0, 2], [1, 2]] },
  { sequence: [[6, 0], [5, 1], [4, 2]], answer: [3, 3], options: [[3, 3], [2, 4], [3, 2], [4, 3], [5, 2], [1, 3]] },
  { sequence: [[0, 3], [1, 4], [2, 5]], answer: [3, 6], options: [[3, 6], [4, 0], [2, 6], [4, 5], [1, 5], [0, 4]] },
  { sequence: [[1, 3], [2, 4], [3, 5]], answer: [4, 6], options: [[4, 6], [5, 0], [3, 6], [5, 4], [4, 5], [2, 3]] },
  { sequence: [[0, 1], [0, 2], [1, 2]], answer: [1, 3], options: [[1, 3], [2, 3], [0, 3], [2, 4], [1, 4], [3, 3]] },

  // ----- BLOQUE B: 11–25 (medio) -----
  { sequence: [[0, 0], [0, 1], [1, 1]], answer: [1, 2], options: [[1, 2], [2, 2], [0, 2], [2, 3], [1, 3], [3, 3]] },
  { sequence: [[0, 1], [1, 0], [1, 2]], answer: [2, 1], options: [[2, 1], [2, 3], [3, 2], [0, 2], [2, 0], [3, 1]] },
  { sequence: [[1, 2], [1, 3], [2, 3]], answer: [2, 4], options: [[2, 4], [3, 4], [3, 5], [1, 4], [2, 5], [4, 4]] },
  { sequence: [[0, 2], [0, 3], [1, 3]], answer: [1, 4], options: [[1, 4], [2, 4], [2, 5], [0, 4], [2, 3], [1, 5]] },
  { sequence: [[0, 4], [0, 5], [1, 5]], answer: [1, 6], options: [[1, 6], [2, 6], [2, 0], [0, 6], [2, 5], [1, 0]] },
  { sequence: [[1, 6], [6, 2], [2, 5]], answer: [5, 3], options: [[5, 3], [3, 4], [4, 0], [0, 5], [3, 5], [4, 3]] },
  { sequence: [[0, 0], [1, 1], [2, 2]], answer: [3, 3], options: [[3, 3], [4, 4], [5, 5], [0, 1], [1, 0], [2, 3]] },
  { sequence: [[6, 6], [5, 6], [5, 5]], answer: [4, 5], options: [[4, 5], [4, 4], [3, 4], [3, 3], [2, 3], [2, 2]] },
  { sequence: [[0, 1], [2, 3], [4, 5]], answer: [6, 0], options: [[6, 0], [1, 2], [3, 4], [5, 6], [0, 2], [2, 0]] },
  { sequence: [[0, 0], [1, 2], [2, 4]], answer: [3, 6], options: [[3, 6], [4, 1], [5, 3], [4, 2], [6, 5], [1, 3]] },
  { sequence: [[6, 6], [5, 4], [4, 2]], answer: [3, 0], options: [[3, 0], [2, 5], [1, 3], [0, 1], [2, 4], [1, 4]] },
  { sequence: [[0, 0], [1, 3], [2, 6]], answer: [3, 2], options: [[3, 2], [4, 5], [5, 1], [6, 4], [4, 6], [5, 0]] },
  { sequence: [[0, 1], [3, 0], [6, 5]], answer: [2, 4], options: [[2, 4], [5, 3], [1, 2], [4, 1], [0, 6], [3, 2]] },
  { sequence: [[0, 0], [0, 1], [1, 3]], answer: [3, 6], options: [[3, 6], [6, 2], [2, 5], [5, 1], [0, 4], [4, 0]] },

  // ----- BLOQUE C: 26–40 (avanzado) -----
  { sequence: [[0, 0], [0, 2], [2, 6]], answer: [6, 5], options: [[6, 5], [5, 1], [1, 4], [4, 0], [3, 6], [6, 2]] },
  { sequence: [[0, 0], [1, 0], [2, 1]], answer: [3, 3], options: [[3, 3], [4, 6], [5, 2], [6, 5], [4, 5], [2, 2]] },
  { sequence: [[0, 0], [1, 2], [3, 5]], answer: [6, 3], options: [[6, 3], [2, 0], [5, 6], [4, 1], [0, 4], [1, 3]] },
  { sequence: [[0, 0], [2, 0], [4, 1]], answer: [0, 3], options: [[0, 3], [2, 6], [4, 5], [6, 4], [0, 2], [1, 4]] },
  { sequence: [[0, 0], [3, 0], [6, 1]], answer: [2, 3], options: [[2, 3], [5, 6], [1, 2], [4, 5], [0, 5], [3, 4]] },
  { sequence: [[0, 1], [2, 3], [4, 5]], answer: [6, 1], options: [[6, 1], [0, 3], [2, 5], [4, 0], [1, 4], [3, 6]] },
  { sequence: [[0, 0], [1, 2], [3, 4]], answer: [5, 6], options: [[5, 6], [1, 1], [2, 2], [3, 3], [4, 4], [6, 6]] },
  { sequence: [[0, 1], [1, 3], [3, 5]], answer: [5, 1], options: [[5, 1], [1, 3], [3, 5], [0, 2], [2, 4], [4, 6]] },
  { sequence: [[0, 0], [0, 1], [1, 2]], answer: [3, 0], options: [[3, 0], [4, 1], [5, 2], [6, 3], [0, 2], [1, 3]] },
  { sequence: [[0, 0], [1, 1], [2, 3]], answer: [4, 6], options: [[4, 6], [0, 3], [1, 4], [2, 5], [3, 6], [4, 0]] },
  { sequence: [[0, 0], [1, 2], [2, 5]], answer: [4, 3], options: [[4, 3], [6, 1], [0, 4], [1, 6], [3, 0], [5, 2]] },
  { sequence: [[0, 0], [2, 1], [4, 3]], answer: [0, 6], options: [[0, 6], [2, 2], [4, 4], [6, 6], [1, 3], [3, 5]] },
  { sequence: [[0, 0], [3, 1], [6, 3]], answer: [2, 6], options: [[2, 6], [5, 2], [1, 5], [4, 1], [0, 4], [3, 0]] },
  { sequence: [[0, 0], [0, 1], [2, 0]], answer: [1, 3], options: [[1, 3], [3, 2], [5, 1], [4, 0], [0, 4], [2, 6]] },
  { sequence: [[0, 0], [1, 2], [0, 4]], answer: [2, 6], options: [[2, 6], [1, 1], [3, 3], [5, 5], [0, 3], [4, 0]] }
];

// ========================
// ESTADO GLOBAL
// ========================
let currentIndex = 0;
let answersState = new Array(TOTAL_ITEMS).fill(null); // índice de opción elegida (0-5)
let shuffledOptions = {}; // por ítem: array de {tile, index}
let timeLeft = MAX_TIME_SECONDS;
let timerId = null;

const participant = {
  name: "",
  lastname: "",
  email: "",
};

// ========================
// UTILIDADES BÁSICAS
// ========================
function $(id) {
  return document.getElementById(id);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ========================
// MODAL
// ========================
function openModal({ title, body, onConfirm, onCancel }) {
  const overlay = $("modal-overlay");
  $("modal-title").textContent = title;
  $("modal-body").textContent = body;
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");

  const confirmBtn = $("modal-confirm");
  const cancelBtn = $("modal-cancel");

  confirmBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };
  cancelBtn.onclick = () => {
    closeModal();
    if (onCancel) onCancel();
  };
  confirmBtn.focus();
}

function closeModal() {
  const overlay = $("modal-overlay");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
}

// ========================
// CREACIÓN DE DOMINÓ
// ========================
function createDots(number) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';

  const positions = {
    0: [],
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
  };

  (positions[number] || []).forEach(([left, top]) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.left = left + '%';
    dot.style.top = top + '%';
    dot.style.transform = 'translate(-50%, -50%)';
    container.appendChild(dot);
  });

  return container;
}

function createDomino(top, bottom, isSmall = false) {
  const domino = document.createElement('div');
  domino.className = isSmall ? 'domino domino-small' : 'domino';

  const topHalf = document.createElement('div');
  topHalf.className = 'domino-half';
  topHalf.appendChild(createDots(top));

  const bottomHalf = document.createElement('div');
  bottomHalf.className = 'domino-half';
  bottomHalf.appendChild(createDots(bottom));

  domino.appendChild(topHalf);
  domino.appendChild(bottomHalf);
  return domino;
}

// ========================
// VALIDACIÓN DE REGISTRO
// ========================
function validateRegistration() {
  const nameEl = $("user-name");
  const lastnameEl = $("user-lastname");
  const emailEl = $("user-email");

  const errors = { name: "", lastname: "", email: "" };
  let isValid = true;

  const nameVal = nameEl.value.trim();
  const lastnameVal = lastnameEl.value.trim();
  const emailVal = emailEl.value.trim();

  if (!nameVal) { errors.name = "Por favor, ingresa tu nombre."; isValid = false; }
  if (!lastnameVal) { errors.lastname = "Por favor, ingresa tu apellido."; isValid = false; }
  if (!emailVal) { errors.email = "Por favor, ingresa tu correo."; isValid = false; }
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)) {
    errors.email = "El formato del correo no es válido.";
    isValid = false;
  }

  function showError(idBase, msg) {
    const inputEl = $(idBase);
    const errEl = $(idBase + "-error");
    if (msg) {
      inputEl.classList.add("input-error");
      errEl.textContent = msg;
      errEl.style.display = "block";
    } else {
      inputEl.classList.remove("input-error");
      errEl.textContent = "";
      errEl.style.display = "none";
    }
  }

  showError("user-name", errors.name);
  showError("user-lastname", errors.lastname);
  showError("user-email", errors.email);

  if (isValid) {
    participant.name = nameVal;
    participant.lastname = lastnameVal;
    participant.email = emailVal;
  }

  return isValid;
}

// ========================
// TIMER
// ========================
function startTimer() {
  timeLeft = MAX_TIME_SECONDS;
  $("timer").classList.remove("timer-over");
  $("timer").textContent = formatTime(timeLeft);

  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      $("timer").textContent = formatTime(0);
      $("timer").classList.add("timer-over");
      clearInterval(timerId);
      timerId = null;
      handleAutoFinishByTime();
    } else {
      $("timer").textContent = formatTime(timeLeft);
    }
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function handleAutoFinishByTime() {
  openModal({
    title: "Tiempo finalizado",
    body: "El tiempo máximo ha terminado. Se calcularán los resultados con las respuestas registradas.",
    onConfirm: finishTest,
    onCancel: finishTest
  });
}

// ========================
// RENDER DE ÍTEM
// ========================
function renderCurrentItem() {
  const item = ITEMS[currentIndex];
  $("question-number").textContent = `Ítem ${currentIndex + 1} de ${ITEMS.length}`;

  // Secuencia
  const seq = $("sequence-container");
  seq.innerHTML = "";
  item.sequence.forEach(dom => {
    seq.appendChild(createDomino(dom[0], dom[1]));
  });
  const qm = document.createElement("div");
  qm.className = "question-mark";
  qm.textContent = "?";
  seq.appendChild(qm);

  // Opciones (con orden estable por ítem)
  if (!shuffledOptions[currentIndex]) {
    const arr = item.options.map((opt, idx) => ({ tile: opt, index: idx }));
    shuffledOptions[currentIndex] = shuffleArray(arr);
  }
  const opts = shuffledOptions[currentIndex];
  const selectedIndex = answersState[currentIndex];

  const optContainer = $("options-container");
  optContainer.innerHTML = "";
  opts.forEach(optObj => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.dataset.optionIndex = String(optObj.index);

    if (selectedIndex === optObj.index) {
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
    }

    btn.appendChild(createDomino(optObj.tile[0], optObj.tile[1], true));
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = "Seleccionar esta ficha";
    btn.appendChild(sr);

    btn.addEventListener("click", () => {
      selectOption(optObj.index);
    });

    btn.addEventListener("keydown", (ev) => {
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        selectOption(optObj.index);
      }
    });

    optContainer.appendChild(btn);
  });

  // Navegación
  $("btn-prev").disabled = currentIndex === 0;
}

function selectOption(optionIndex) {
  answersState[currentIndex] = optionIndex;

  // Actualizar estado visual
  document.querySelectorAll(".option-btn").forEach(btn => {
    const idx = parseInt(btn.dataset.optionIndex, 10);
    if (idx === optionIndex) {
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
    } else {
      btn.classList.remove("selected");
      btn.setAttribute("aria-checked", "false");
    }
  });

  // Avanzar automáticamente salvo en el último ítem
  if (currentIndex < ITEMS.length - 1) {
    setTimeout(() => {
      currentIndex++;
      renderCurrentItem();
    }, 250);
  }
}

// ========================
// CÁLCULO DE PUNTUACIONES
// ========================
function computeScores() {
  let pd = 0;
  let blockA = 0;
  let blockB = 0;
  let blockC = 0;
  let answeredCount = 0;

  ITEMS.forEach((item, idx) => {
    const selectedIndex = answersState[idx];
    if (selectedIndex !== null && selectedIndex >= 0) {
      answeredCount++;
      const selectedTile = item.options[selectedIndex];
      const ans = item.answer;
      const correct = selectedTile &&
        selectedTile[0] === ans[0] &&
        selectedTile[1] === ans[1];
      if (correct) {
        pd++;
        if (idx < 10) blockA++;
        else if (idx < 25) blockB++;
        else blockC++;
      }
    }
  });

  const pa = Math.round((pd / ITEMS.length) * 100);
  const elapsedSec = MAX_TIME_SECONDS - timeLeft;
  const elapsedSecSafe = elapsedSec > 0 ? elapsedSec : 1;
  const elapsedMinutes = elapsedSecSafe / 60;
  const ier = pd / Math.sqrt(elapsedMinutes);
  const speedItemsPerMin = answeredCount / elapsedMinutes;

  return {
    pd,
    pa,
    blockA,
    blockB,
    blockC,
    answeredCount,
    omitted: ITEMS.length - answeredCount,
    elapsedSec: Math.round(elapsedSecSafe),
    elapsedMinutes,
    ier,
    speedItemsPerMin
  };
}

// ========================
// FINALIZAR PRUEBA
// ========================
function requestFinishTest() {
  const { answeredCount, omitted } = computeScores();
  const msg = omitted > 0
    ? `Has respondido ${answeredCount} de ${ITEMS.length} ítems. Quedan ${omitted} sin respuesta.\n¿Deseas finalizar la prueba y enviar tus resultados?`
    : `Has respondido los ${ITEMS.length} ítems.\n¿Deseas finalizar la prueba y enviar tus resultados?`;

  openModal({
    title: "Finalizar prueba",
    body: msg,
    onConfirm: finishTest
  });
}

async function finishTest() {
  stopTimer();
  const scores = computeScores();

  // Guardar en Apps Script
  if (SAVE_RESULTS_URL) {
    try {
      await saveResultsRemote(scores);
      
    } catch (e) {
      console.error("Error al enviar resultados:", e);
    }
  }

  // Ajuste visual del contenedor
  const cont = $("main-container");
  cont.classList.remove("modo-test");
  cont.classList.add("modo-resultados");

  $("results-participant").textContent = `${participant.name} ${participant.lastname}`;

  showScreen("screen-results");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ========================
// ENVÍO A APPS SCRIPT
// ========================
async function saveResultsRemote(scores) {
 

  // Construir string de respuestas "1:1,2:0,3:1,..."
  let respuestasString = "";
  for (let i = 0; i < ITEMS.length; i++) {
    const answerIndex = answersState[i];
    let value = 0;

    if (answerIndex !== null && answerIndex >= 0) {
      const item = ITEMS[i];
      const selectedTile = item.options[answerIndex];
      const ans = item.answer;

      const isCorrect =
        selectedTile &&
        selectedTile[0] === ans[0] &&
        selectedTile[1] === ans[1];

      value = isCorrect ? 1 : 0;
    }

    respuestasString += `${i + 1}:${value}`;
    if (i < ITEMS.length - 1) respuestasString += ",";
  }
  const datosRecibidos = {
    fila: [
      new Date().toISOString(),
      participant.name,
      participant.lastname,
      getStoredEmail(),
      respuestasString
    ]
  };

  const resp = await fetch(SAVE_RESULTS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosRecibidos),
  });
incrementCountAndRenderRetry();
  const text = await resp.text();
  console.log("Respuesta Apps Script:", text);

  if (!resp.ok || !/^Guardado/i.test(text.trim())) {
    throw new Error("Apps Script respondió: " + text);
  }
  
}

// ========================
// EVENTOS
// ========================
$("btn-go-instructions").addEventListener("click", () => {
  if (!validateRegistration()) return;
  $("participant-label").textContent = `Participante: ${participant.name} ${participant.lastname}`;
  showScreen("screen-instructions");
});

$("btn-back-registration").addEventListener("click", () => {
  showScreen("screen-registration");
});

$("btn-start-test").addEventListener("click", () => {
  currentIndex = 0;
  answersState = new Array(TOTAL_ITEMS).fill(null);
  shuffledOptions = {};
  timeLeft = MAX_TIME_SECONDS;

  $("main-container").classList.add("modo-test");
  showScreen("screen-test");
  renderCurrentItem();
  startTimer();
});

$("btn-prev").addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentItem();
  }
});

$("btn-summary-mini").addEventListener("click", () => {
  const { answeredCount, omitted } = computeScores();
  openModal({
    title: "Resumen rápido",
    body: `Ítems respondidos: ${answeredCount} · Omisiones: ${omitted}.`,
    onConfirm: closeModal,
    onCancel: closeModal
  });
});

$("btn-finish").addEventListener("click", () => {
  requestFinishTest();
});

/**
 * ============================================================
 *  PDA STACK SIMULATOR — script.js
 *  Deterministic Execution Engine
 * ============================================================
 */

/* ────────────────────────────────────────
   GLOBAL STATE
──────────────────────────────────────── */
const simulationState = {
  input: "",
  position: 0,
  stack: [],
  steps: [],
  currentStep: 0,
  isRunning: false,
  isFinished: false,
  result: null, // "ACCEPTED" or "REJECTED"
  error: null,
  language: "anbn",
  intervalId: null
};

/** Utility to clone the simulation state for comparison mode */
function cloneSimulationState(state) {
  return JSON.parse(JSON.stringify(state));
}

/* ────────────────────────────────────────
   DOM REFERENCES
──────────────────────────────────────── */
const $ = id => document.getElementById(id);

const dom = {
  langSelect:      $('langSelect'),
  inputString:     $('inputString'),
  fieldHint:       $('fieldHint'),
  btnRun:          $('btnRun'),
  btnStep:         $('btnStep'),
  btnReset:        $('btnReset'),
  speedSlider:     $('speedSlider'),
  tapeTrack:       $('tapeTrack'),
  tapeEmptyMsg:    $('tapeEmptyMsg'),
  tapeProgressFill:$('tapeProgressFill'),
  tapeStats:       $('tapeStats'),
  tapeStatus:      $('tapeStatus'),
  stackBody:       $('stackBody'),
  stackEmptyState: $('stackEmptyState'),
  stackTopLabel:   $('stackTopLabel'),
  stackDepth:      $('stackDepth'),
  lastOpVal:       $('lastOpVal'),
  topSymVal:       $('topSymVal'),
  phaseVal:        $('phaseVal'),
  logBody:         $('logBody'),
  logEmpty:        $('logEmpty'),
  resultBody:      $('resultBody'),
  stepBar:         $('stepBar'),
  stepCounter:     $('stepCounter'),
  stepFill:        $('stepFill'),
  formalBody:      $('formalBody')
};

/* ────────────────────────────────────────
   INIT
──────────────────────────────────────── */
dom.langSelect.addEventListener('change', () => {
  simulationState.language = dom.langSelect.value;
  updateHint();
  resetSimulation();
});

dom.inputString.addEventListener('input', () => {
  updateHint();
});

dom.inputString.addEventListener('keydown', e => {
  if (e.key === 'Enter') runSimulation();
});

function updateHint() {
  const lang = dom.langSelect.value;
  const allowed = lang === 'anbn' ? /^[ab]*$/ : /^[abc]*$/;
  const val = dom.inputString.value.trim();
  const hint = dom.fieldHint;
  if (val && !allowed.test(val)) {
    hint.textContent = lang === 'anbn'
      ? '⚠ Only characters a and b are allowed'
      : '⚠ Only characters a, b, and c are allowed';
    hint.classList.add('error-text');
    dom.inputString.classList.add('error');
  } else {
    hint.textContent = lang === 'anbn'
      ? 'Example: aaabbb'
      : 'Example: aaabbbccc';
    hint.classList.remove('error-text');
    dom.inputString.classList.remove('error');
  }
}

/* ────────────────────────────────────────
   STEP GENERATION (PRECOMPUTE)
──────────────────────────────────────── */
function generateSteps(input, languageType) {
  const steps = [];
  const stack = [];
  let currentPos = 0;
  let phase = "INITIALIZATION";
  let state = "q0";

  // Initial state
  steps.push({
    symbol: "ε",
    action: "none",
    stackBefore: [],
    stackAfter: [],
    state: "q0",
    phase: "START",
    position: 0,
    description: "Simulation started",
    ruleId: null
  });

  if (languageType === 'anbn') {
    // Phase 1: Reading a's
    phase = "PUSH PHASE";
    while (currentPos < input.length && input[currentPos] === 'a') {
      const stackBefore = [...stack];
      stack.push('A');
      steps.push({
        symbol: 'a',
        action: 'push',
        stackBefore,
        stackAfter: [...stack],
        state: "q0",
        phase,
        position: currentPos + 1,
        description: `Read 'a', PUSH 'A'`,
        ruleId: "rule-anbn-a"
      });
      currentPos++;
    }

    // Phase 2: Reading b's
    phase = "POP PHASE";
    let firstB = true;
    while (currentPos < input.length && input[currentPos] === 'b') {
      const stackBefore = [...stack];
      if (stack.length === 0) {
        simulationState.error = "Read 'b' but stack is empty (more b's than a's)";
        break;
      }
      stack.pop();
      state = "q1";
      steps.push({
        symbol: 'b',
        action: 'pop',
        stackBefore,
        stackAfter: [...stack],
        state: "q1",
        phase,
        position: currentPos + 1,
        description: `Read 'b', POP 'A'`,
        ruleId: firstB ? "rule-anbn-b-q0" : "rule-anbn-b-q1",
        isTransition: firstB
      });
      firstB = false;
      currentPos++;
    }

    // Check for invalid characters or order
    if (!simulationState.error && currentPos < input.length) {
      simulationState.error = `Unexpected character '${input[currentPos]}' at position ${currentPos + 1}`;
    }
  } 
  else if (languageType === 'anbncn') {
    // Phase 1: Reading a's -> PUSH A
    phase = "PUSH PHASE (a)";
    while (currentPos < input.length && input[currentPos] === 'a') {
      const stackBefore = [...stack];
      stack.push('A');
      steps.push({
        symbol: 'a',
        action: 'push',
        stackBefore,
        stackAfter: [...stack],
        state: "q0",
        phase,
        position: currentPos + 1,
        description: `Read 'a', PUSH 'A'`,
        ruleId: "rule-anbncn-a"
      });
      currentPos++;
    }

    // Phase 2: Reading b's -> SWAP A with B
    phase = "TRANSITION PHASE (b)";
    let firstB = true;
    while (currentPos < input.length && input[currentPos] === 'b') {
      const stackBefore = [...stack];
      if (stack.length === 0 || stack[stack.length - 1] !== 'A') {
        let aIndex = -1;
        for(let i = stack.length - 1; i >= 0; i--) {
            if(stack[i] === 'A') { aIndex = i; break; }
        }
        
        if (aIndex === -1) {
            simulationState.error = "Read 'b' but no 'A' found on stack (more b's than a's)";
            break;
        }
        stack[aIndex] = 'B';
      } else {
        stack.pop();
        stack.push('B');
      }
      
      state = "q1";
      steps.push({
        symbol: 'b',
        action: 'swap',
        stackBefore,
        stackAfter: [...stack],
        state: "q1",
        phase,
        position: currentPos + 1,
        description: `Read 'b', replace 'A' with 'B'`,
        ruleId: firstB ? "rule-anbncn-b-q0" : "rule-anbncn-b-q1",
        isTransition: firstB
      });
      firstB = false;
      currentPos++;
    }

    // Phase 3: Reading c's -> POP B
    phase = "POP PHASE (c)";
    let firstC = true;
    while (!simulationState.error && currentPos < input.length && input[currentPos] === 'c') {
      const stackBefore = [...stack];
      if (stack.length === 0 || stack[stack.length - 1] !== 'B') {
        simulationState.error = "Read 'c' but no 'B' found on top (unequal counts or wrong order)";
        break;
      }
      stack.pop();
      state = "q2";
      steps.push({
        symbol: 'c',
        action: 'pop',
        stackBefore,
        stackAfter: [...stack],
        state: "q2",
        phase,
        position: currentPos + 1,
        description: `Read 'c', POP 'B'`,
        ruleId: firstC ? "rule-anbncn-c-q1" : "rule-anbncn-c-q2",
        isTransition: firstC
      });
      firstC = false;
      currentPos++;
    }

    if (!simulationState.error && currentPos < input.length) {
      simulationState.error = `Invalid order: character '${input[currentPos]}' found at position ${currentPos + 1}`;
    }
  }

  simulationState.steps = steps;
}

/* ────────────────────────────────────────
   FORMAL DEFINITION RULES
──────────────────────────────────────── */
function populateFormalDefinition(lang) {
  const body = dom.formalBody;
  body.innerHTML = '';
  
  const rules = lang === 'anbn' ? [
    { id: "rule-anbn-a", text: "δ(q₀, a, ε) → (q₀, A)" },
    { id: "rule-anbn-b-q0", text: "δ(q₀, b, A) → (q₁, ε)" },
    { id: "rule-anbn-b-q1", text: "δ(q₁, b, A) → (q₁, ε)" }
  ] : [
    { id: "rule-anbncn-a", text: "δ(q₀, a, ε) → (q₀, A)" },
    { id: "rule-anbncn-b-q0", text: "δ(q₀, b, A) → (q₁, B)" },
    { id: "rule-anbncn-b-q1", text: "δ(q₁, b, A) → (q₁, B)" },
    { id: "rule-anbncn-c-q1", text: "δ(q₁, c, B) → (q₂, ε)" },
    { id: "rule-anbncn-c-q2", text: "δ(q₂, c, B) → (q₂, ε)" }
  ];

  rules.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'formal-row';
    div.id = rule.id;
    div.textContent = rule.text;
    body.appendChild(div);
  });
}

/* ────────────────────────────────────────
   CORE EXECUTION ENGINE
──────────────────────────────────────── */
function executeStep() {
  if (simulationState.isFinished) return;

  const step = simulationState.steps[simulationState.currentStep];
  
  // Apply state changes
  simulationState.stack = [...step.stackAfter];
  simulationState.position = step.position;

  // Update UI
  updateUI(step);

  // Advance
  simulationState.currentStep++;

  // Check termination
  if (simulationState.currentStep === simulationState.steps.length || simulationState.error) {
    finalizeResult();
  }
}

function finalizeResult() {
  simulationState.isFinished = true;
  simulationState.isRunning = false;
  if (simulationState.intervalId) {
    clearInterval(simulationState.intervalId);
    simulationState.intervalId = null;
  }

  const stackEmpty = simulationState.stack.length === 0;
  const inputConsumed = simulationState.position === simulationState.input.length;

  if (!simulationState.error && stackEmpty && inputConsumed) {
    simulationState.result = "ACCEPTED";
  } else {
    simulationState.result = "REJECTED";
    if (!simulationState.error) {
      if (!inputConsumed) simulationState.error = "Input string not fully consumed";
      else if (!stackEmpty) simulationState.error = `Stack not empty (${simulationState.stack.length} item(s) remaining)`;
    }
  }

  renderFinalResult();
  dom.btnStep.disabled = true;
  dom.tapeStatus.textContent = simulationState.result;
  dom.tapeStatus.className = `card-tag ${simulationState.result === 'ACCEPTED' ? 'done' : 'rejected'}`;
}

/* ────────────────────────────────────────
   UI SYNCHRONIZATION
──────────────────────────────────────── */
function updateUI(step) {
  // 1. Tape
  const cells = dom.tapeTrack.querySelectorAll('.tape-cell');
  cells.forEach((cell, i) => {
    const charEl = cell.querySelector('.tape-char');
    charEl.classList.remove('active');
    charEl.classList.toggle('done-char', i < step.position);
    if (i === step.position - 1) {
      charEl.classList.add('active');
      cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  dom.tapeProgressFill.style.width = `${(step.position / (simulationState.input.length || 1)) * 100}%`;
  dom.tapeStats.textContent = `Position ${step.position} / ${simulationState.input.length}`;

  // 2. Stack
  renderStack();
  dom.stackDepth.textContent = simulationState.stack.length;
  dom.topSymVal.textContent = simulationState.stack.length > 0 ? simulationState.stack[simulationState.stack.length - 1] : "—";
  dom.lastOpVal.textContent = step.description;
  dom.phaseVal.textContent = step.phase;

  // 3. Log
  appendLog(step);

  // 4. State Diagram
  updateStateDiagram(step);

  // 5. Formal Definition
  updateFormalHighlight(step);

  // 6. Progress Bar
  const total = simulationState.steps.length;
  dom.stepFill.style.width = `${(simulationState.currentStep / (total - 1)) * 100}%`;
  dom.stepCounter.textContent = `Step ${simulationState.currentStep + 1} / ${total}`;
}

function renderStack() {
  const body = dom.stackBody;
  const stack = simulationState.stack;
  
  if (stack.length === 0) {
    body.innerHTML = '';
    body.appendChild(dom.stackEmptyState);
    dom.stackTopLabel.classList.remove('visible');
    return;
  }

  const emptyEl = body.querySelector('.stack-empty-state');
  if (emptyEl) emptyEl.remove();
  dom.stackTopLabel.classList.add('visible');

  body.innerHTML = '';
  stack.forEach((sym, idx) => {
    const div = document.createElement('div');
    div.className = `stack-item sym-${sym} ${idx === stack.length - 1 ? 'sym-top' : ''}`;
    div.innerHTML = `<span class="stack-item-sym">${sym}</span><span class="stack-item-idx">#${idx + 1}</span>`;
    body.appendChild(div);
  });
}

function appendLog(step) {
  if (dom.logEmpty) dom.logEmpty.style.display = 'none';

  dom.logBody.querySelectorAll('.log-entry.log-active').forEach(el => el.classList.remove('log-active'));

  const entry = document.createElement('div');
  const typeClass = step.action === 'push' ? 'log-push' : step.action === 'pop' ? 'log-pop' : 'log-info';
  entry.className = `log-entry ${typeClass} log-active`;

  const stackStr = simulationState.stack.length > 0 ? `[${simulationState.stack.join('')}]` : '[ ∅ ]';

  entry.innerHTML = `
    <span class="log-step">Step ${simulationState.currentStep + 1}</span>
    <span class="log-sym">${step.symbol}</span>
    <span class="log-action">${step.description}</span>
    <span class="log-stack-snap">${stackStr}</span>
  `;

  dom.logBody.appendChild(entry);
  dom.logBody.scrollTop = dom.logBody.scrollHeight;
}

function updateStateDiagram(step) {
  // Clear all highlights
  document.querySelectorAll('.state-node, .trans-arrow, .self-loop').forEach(el => {
    el.classList.remove('active-node', 'active-transition');
  });

  // Highlight active node
  const activeNode = $(`node-${step.state}`);
  if (activeNode) activeNode.classList.add('active-node');

  // Highlight transition
  if (step.ruleId) {
    if (step.isTransition) {
        // Character triggered state change
        const prevStep = simulationState.steps[simulationState.currentStep - 1];
        if (prevStep) {
            const arrowId = `arrow-${prevStep.state}${step.state}`;
            const arrow = $(arrowId);
            if (arrow) arrow.classList.add('active-transition');
        }
    } else if (step.symbol !== 'ε') {
        // Self-loop
        const loop = $(`loop-${step.state}`);
        if (loop) loop.classList.add('active-transition');
    }
  }
}

function updateFormalHighlight(step) {
  document.querySelectorAll('.formal-row').forEach(el => el.classList.remove('active-rule'));
  if (step.ruleId) {
    const ruleRow = $(step.ruleId);
    if (ruleRow) ruleRow.classList.add('active-rule');
  }
}

function renderFinalResult() {
  const accepted = simulationState.result === "ACCEPTED";
  dom.resultBody.innerHTML = `
    <div class="result-verdict ${accepted ? 'accepted' : 'rejected'}">
      <div class="result-icon">${accepted ? '✔' : '✗'}</div>
      <div class="result-text">
        <h3>${accepted ? 'Accepted' : 'Rejected'}</h3>
        <p>${simulationState.error ? simulationState.error : (accepted ? "Input matches language rules perfectly." : "Simulation failed to reach acceptance state.")}</p>
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────
   CONTROLS
──────────────────────────────────────── */
function runSimulation() {
  const input = dom.inputString.value.trim();
  const lang = dom.langSelect.value;

  resetSimulation();
  
  simulationState.input = input;
  simulationState.language = lang;
  simulationState.isRunning = true;

  populateFormalDefinition(lang);
  generateSteps(input, lang);
  renderTape(input);

  dom.stepBar.classList.add('visible');
  dom.btnStep.disabled = false;

  const speed = 1300 - parseInt(dom.speedSlider.value, 10);
  simulationState.intervalId = setInterval(() => {
    executeStep();
  }, speed);
}

function stepForward() {
  if (simulationState.intervalId) {
    clearInterval(simulationState.intervalId);
    simulationState.intervalId = null;
    simulationState.isRunning = false;
  }

  if (simulationState.steps.length === 0) {
    const input = dom.inputString.value.trim();
    simulationState.input = input;
    populateFormalDefinition(dom.langSelect.value);
    generateSteps(input, dom.langSelect.value);
    renderTape(input);
    dom.stepBar.classList.add('visible');
  }

  executeStep();
}

function resetSimulation() {
  if (simulationState.intervalId) {
    clearInterval(simulationState.intervalId);
  }

  // Reset State
  simulationState.input = "";
  simulationState.position = 0;
  simulationState.stack = [];
  simulationState.steps = [];
  simulationState.currentStep = 0;
  simulationState.isRunning = false;
  simulationState.isFinished = false;
  simulationState.result = null;
  simulationState.error = null;
  simulationState.intervalId = null;

  // Reset UI
  dom.tapeTrack.innerHTML = '';
  dom.tapeEmptyMsg.style.display = 'block';
  dom.tapeProgressFill.style.width = '0%';
  dom.tapeStats.textContent = '';
  dom.tapeStatus.textContent = 'Ready';
  dom.tapeStatus.className = 'card-tag';

  dom.stackBody.innerHTML = '';
  dom.stackBody.appendChild(dom.stackEmptyState);
  dom.stackTopLabel.classList.remove('visible');
  dom.stackDepth.textContent = '0';
  dom.topSymVal.textContent = '—';
  dom.lastOpVal.textContent = '—';
  dom.phaseVal.textContent = '—';

  dom.logBody.innerHTML = '';
  if (dom.logEmpty) dom.logEmpty.style.display = 'block';
  dom.logBody.appendChild(dom.logEmpty);

  dom.resultBody.innerHTML = `
    <div class="result-placeholder">
      <div class="result-placeholder-icon">○</div>
      <span>Awaiting simulation…</span>
    </div>`;

  dom.formalBody.innerHTML = '<div class="formal-placeholder">Select language to see rules</div>';
  dom.stepBar.classList.remove('visible');
  dom.btnStep.disabled = true;
  
  // Clear diagram highlights
  document.querySelectorAll('.state-node, .trans-arrow, .self-loop').forEach(el => {
    el.classList.remove('active-node', 'active-transition');
  });

  updateHint();
}

function renderTape(str) {
  dom.tapeEmptyMsg.style.display = 'none';
  dom.tapeTrack.innerHTML = '';
  for (let i = 0; i < str.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'tape-cell';
    cell.innerHTML = `<div class="tape-char char-${str[i]}">${str[i]}</div><div class="tape-idx">${i}</div>`;
    dom.tapeTrack.appendChild(cell);
  }
}

function clearInput() {
  dom.inputString.value = '';
  resetSimulation();
}

// Bind globals for HTML onclicks
window.runSimulation = runSimulation;
window.stepForward = stepForward;
window.resetSimulation = resetSimulation;
window.clearInput = clearInput;
window.clearLog = () => {
    dom.logBody.innerHTML = '';
    if (dom.logEmpty) dom.logEmpty.style.display = 'block';
    dom.logBody.appendChild(dom.logEmpty);
};

updateHint();

const playerName = 'Kartikam Pandey';

let stats = JSON.parse(localStorage.getItem('yuvaStats')) || {
  memory: { plays: 0 },
  speed: { plays: 0 },
  reaction: []
};

updateProfile();

function updateProfile() {
  document.getElementById('profile').innerHTML =
    `${playerName}<br>Memory Plays: ${stats.memory.plays} | Speed Plays: ${stats.speed.plays}`;
}

function saveStats() {
  localStorage.setItem('yuvaStats', JSON.stringify(stats));
  updateProfile();
}

function goBack() {
  document.getElementById('hub').style.display = 'flex';
  document.getElementById('speedTestUI').style.display = 'none';
  document.getElementById('memoryTestUI').style.display = 'none';
  document.getElementById('backBtn').style.display = 'none';

  document.getElementById('bg').className = 'bg-hub';
  document.getElementById('particles').style.display = 'none';

  clearInterval(speedTimer);
  clearInterval(memDisplayInterval);
  cancelAnimationFrame(particleAnimationId);
}

function showPerformance() {
  document.getElementById('performancePanel').style.display = 'block';
  drawGraph();
}

function closePerformance() {
  document.getElementById('performancePanel').style.display = 'none';
}

function drawGraph() {
  const c = document.getElementById('graph');
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 600, 300);

  ctx.strokeStyle = '#1f2933';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 60);
    ctx.lineTo(600, i * 60);
    ctx.stroke();
  }

  if (stats.reaction.length === 0) return;

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const step = 600 / Math.max(stats.reaction.length, 10);

  stats.reaction.forEach((val, i) => {
    let normalized = Math.max(10, 300 - (val / 10));
    const x = i * step + (step / 2);
    if (i === 0) ctx.moveTo(x, normalized); else ctx.lineTo(x, normalized);
  });
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  stats.reaction.forEach((val, i) => {
    let normalized = Math.max(10, 300 - (val / 10));
    const x = i * step + (step / 2);
    ctx.beginPath();
    ctx.arc(x, normalized, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

const speedRuleText = document.getElementById('speedRuleText');
const speedStartBtn = document.getElementById('speedStartBtn');
const speedRulesUI = document.getElementById('speedRules');
const speedGameUI = document.getElementById('speedGame');
const speedMessage = document.getElementById('speedMessage');
const speedGrid = document.getElementById('speedGrid');
const speedArrow = document.getElementById('speedArrow');

let sLevel = 1, sStreak = 0, sNumbers = [], sCorrectValue = 0;
let speedTimer, sTimeLimit = 7, sRemaining, sCanClick = false;
let sRoundStartTime = 0, speedRulesTyped = false;

const sRulesList = [
  'Rule 1: Arrow ⬆ means click the HIGHEST number.',
  'Rule 2: Arrow ⬇ means click the LOWEST number.',
  'Rule 3: Finish your choice before the countdown ends.'
];

let sRuleIndex = 0, sCharIndex = 0;

function openSpeedTest() {
  document.getElementById('hub').style.display = 'none';
  document.getElementById('speedTestUI').style.display = 'block';
  document.getElementById('backBtn').style.display = 'block';
  document.getElementById('bg').className = 'bg-speed';

  speedGameUI.style.display = 'none';
  speedRulesUI.style.display = 'flex';

  if (!speedRulesTyped) {
    speedRuleText.textContent = '';
    sRuleIndex = 0;
    sCharIndex = 0;
    speedStartBtn.style.display = 'none';
    typeSpeedRules();
  }
}

function typeSpeedRules() {
  if (sRuleIndex >= sRulesList.length) {
    speedRulesTyped = true;
    speedStartBtn.style.display = 'block';
    return;
  }

  if (sCharIndex < sRulesList[sRuleIndex].length) {
    speedRuleText.textContent += sRulesList[sRuleIndex][sCharIndex++];
    setTimeout(typeSpeedRules, 30);
  } else {
    speedRuleText.textContent += '\n';
    sRuleIndex++;
    sCharIndex = 0;
    setTimeout(typeSpeedRules, 400);
  }
}

speedStartBtn.onclick = () => {
  document.getElementById('audioStart').play().catch(() => {});
  speedRulesUI.style.display = 'none';
  speedGameUI.style.display = 'block';
  sLevel = 1;
  sStreak = 0;
  updateSpeedUI();
  stats.speed.plays++;
  saveStats();
  startSpeedRound();
};

function startSpeedRound() {
  clearInterval(speedTimer);
  sTimeLimit = sLevel >= 10 ? 4 : (sLevel >= 5 ? 5 : 7);
  speedGrid.innerHTML = '';
  sNumbers = [];

  let boxCount = sLevel >= 10 ? 20 : (sLevel >= 5 ? 16 : 12);
  while (sNumbers.length < boxCount) {
    sNumbers.push(Math.floor(Math.random() * (sLevel >= 5 ? 99 : 25)) + 1);
  }

  sNumbers.forEach((v) => {
    const cell = document.createElement('div');
    cell.className = 'speed-cell';
    cell.textContent = v;
    cell.onclick = () => handleSpeedClick(v, cell);
    speedGrid.appendChild(cell);
  });

  speedArrow.textContent = Math.random() < 0.5 ? '⬆️' : '⬇️';
  sCorrectValue = speedArrow.textContent === '⬆️' ? Math.max(...sNumbers) : Math.min(...sNumbers);

  sRemaining = sTimeLimit;
  document.getElementById('speedTime').textContent = sRemaining;
  document.getElementById('speedProgress').style.strokeDashoffset = 0;

  sCanClick = true;
  speedMessage.textContent = '';
  sRoundStartTime = Date.now();
  speedTimer = setInterval(updateSpeedTimer, 1000);
}

function updateSpeedTimer() {
  sRemaining--;
  document.getElementById('speedTime').textContent = sRemaining;
  document.getElementById('speedProgress').style.strokeDashoffset = 314 * (1 - sRemaining / sTimeLimit);

  if (sRemaining <= 0) {
    speedMessage.textContent = "Time's up ⏳ You lost.";
    loseSpeedRound();
  }
}

function handleSpeedClick(value, cell) {
  if (!sCanClick) return;

  sCanClick = false;
  const ac = document.getElementById('audioClick');
  ac.currentTime = 0;
  ac.play().catch(() => {});

  cell.classList.add('clicked');
  setTimeout(() => cell.classList.remove('clicked'), 250);

  if (value === sCorrectValue) {
    stats.reaction.push(Date.now() - sRoundStartTime);
    saveStats();
    document.getElementById('audioWin').play().catch(() => {});
    sStreak++;
    sLevel++;
    speedMessage.textContent = 'Correct! 🔥';
    updateSpeedUI();
    setTimeout(startSpeedRound, 800);
  } else {
    speedMessage.textContent = `Wrong ❌ clicked ${value}, correct was ${sCorrectValue}`;
    loseSpeedRound();
  }
}

function loseSpeedRound() {
  clearInterval(speedTimer);
  document.getElementById('audioLose').play().catch(() => {});
  speedMessage.textContent += '  Restarting...';
  sLevel = 1;
  sStreak = 0;
  updateSpeedUI();
  setTimeout(startSpeedRound, 3000);
}

function updateSpeedUI() {
  document.getElementById('speedLevel').textContent = 'Level: ' + sLevel;
  document.getElementById('speedStreak').textContent = 'Streak: ' + sStreak;
}

const memoryRulesUI = document.getElementById('memoryRules');
const memStartBtn = document.getElementById('memoryStartBtn');
const memoryGameUI = document.getElementById('memoryGame');
const memGrid = document.getElementById('memoryGrid');
const memReport = document.getElementById('memoryReport');

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particleAnimationId;
const particlesArray = Array.from({ length: 60 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2 + 1,
  vx: Math.random() * 0.3 - 0.15,
  vy: Math.random() * 0.3 - 0.15
}));

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';

  particlesArray.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  particleAnimationId = requestAnimationFrame(animateParticles);
}

let mLevel = 1, mStreak = 0, mBest = 0;
let mPattern = [], mInput = [], mAccepting = false, mStartTime = 0;
let memDisplayInterval;

function openMemoryTest() {
  document.getElementById('hub').style.display = 'none';
  document.getElementById('memoryTestUI').style.display = 'block';
  document.getElementById('backBtn').style.display = 'block';

  document.getElementById('bg').className = 'bg-memory';
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  animateParticles();

  memoryGameUI.style.display = 'none';
  memoryRulesUI.style.display = 'flex';
}

memStartBtn.onclick = () => {
  memoryRulesUI.style.display = 'none';
  memoryGameUI.style.display = 'block';
  stats.memory.plays++;
  saveStats();
  startMemLevel();
};

function memoryLoad() {
  if (mLevel <= 4) return mLevel;
  if (mLevel < 15) return 4;
  return 5;
}

function tileCount() {
  if (mLevel <= 3) return 9;
  if (mLevel <= 6) return 12;
  if (mLevel <= 9) return 16;
  if (mLevel <= 14) return 24;
  return 25;
}

function startMemLevel() {
  mPattern = [];
  mInput = [];
  mAccepting = false;
  memReport.innerHTML = '';

  memGrid.innerHTML = '';
  const count = tileCount();
  const size = Math.ceil(Math.sqrt(count));
  memGrid.style.gridTemplateColumns = `repeat(${size}, 70px)`;

  for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
    cell.className = 'mem-cell';
    cell.onclick = () => handleMemClick(i, cell);
    memGrid.appendChild(cell);
  }

  const load = memoryLoad();
  while (mPattern.length < load) {
    const r = Math.floor(Math.random() * count);
    if (!mPattern.includes(r)) mPattern.push(r);
  }

  mStartTime = performance.now();
  showMemPattern();
}

function showMemPattern() {
  const cells = document.querySelectorAll('.mem-cell');
  let i = 0;
  memDisplayInterval = setInterval(() => {
    if (i > 0) cells[mPattern[i - 1]].classList.remove('active');
    if (i === mPattern.length) {
      clearInterval(memDisplayInterval);
      mAccepting = true;
      return;
    }
    cells[mPattern[i]].classList.add('active');
    i++;
  }, 500);
}

function handleMemClick(index, cell) {
  if (!mAccepting || cell.classList.contains('selected')) return;

  cell.classList.add('selected');
  mInput.push(index);

  if (mInput[mInput.length - 1] !== mPattern[mInput.length - 1]) {
    mStreak = 0;
    showMemReport();
    return;
  }

  if (mInput.length === mPattern.length) {
    const elapsed = ((performance.now() - mStartTime) / 1000).toFixed(2);
    document.getElementById('memTimer').textContent = `Time: ${elapsed}s`;

    mLevel++;
    mStreak++;
    mBest = Math.max(mBest, mStreak);

    document.getElementById('memStreak').textContent = `Streak: ${mStreak}`;
    document.getElementById('memBest').textContent = `Best: ${mBest}`;
    document.getElementById('memLevel').textContent = `Level: ${mLevel}`;

    if (mLevel === 15) memReport.innerHTML = '🌟 Elite Memory Level Reached';
    setTimeout(startMemLevel, 700);
  }
}

function showMemReport() {
  const percentile = Math.min(99, Math.floor(40 + mLevel * 4));
  memReport.innerHTML = `
    <h3>Memory Performance</h3>
    <p>Highest Level Reached: ${mLevel}</p>
    <p>Estimated Rank: Top ${100 - percentile}%</p>
  `;

  mLevel = 1;
  document.getElementById('memLevel').textContent = 'Level: 1';
  setTimeout(startMemLevel, 2500);
}

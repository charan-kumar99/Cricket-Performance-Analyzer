let players = [];
let charts = {
  runs: null,
  strike: null,
  boundaries: null
};
let confirmCallback = null;
let deletedPlayers = []; // Undo buffer
let toastCount = 0; // Limit concurrent toasts
let cachedElements = {}; // Cache DOM elements
let searchDebounceTimer = null;

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sanitize text to prevent XSS
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape CSV field
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Validate loaded data
function validatePlayerData(player) {
  return player && 
    typeof player.name === 'string' &&
    typeof player.team === 'string' &&
    typeof player.runs === 'number' &&
    typeof player.balls === 'number' &&
    typeof player.fours === 'number' &&
    typeof player.sixes === 'number' &&
    typeof player.format === 'string' &&
    player.runs >= 0 && player.balls >= 0 &&
    player.fours >= 0 && player.sixes >= 0;
}

function loadPlayers() {
  try {
    const data = localStorage.getItem("players");
    if (!data) {
      players = [];
      return;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      players = [];
      return;
    }
    // Validate and filter data
    players = parsed.filter(validatePlayerData).map(p => ({
      ...p,
      id: p.id || generateId() // Add ID if missing
    }));
  } catch (e) {
    console.error('Failed to load players:', e);
    players = [];
    showToast('Failed to load data from storage', 'error');
  }
}

function savePlayers() {
  try {
    localStorage.setItem("players", JSON.stringify(players));
  } catch (e) {
    console.error('Failed to save players:', e);
    if (e.name === 'QuotaExceededError') {
      showToast('Storage quota exceeded. Please delete some players.', 'error');
    } else {
      showToast('Failed to save data', 'error');
    }
  }
}

function calculateStrikeRate(runs, balls) {
  return balls === 0 ? 0 : ((runs / balls) * 100).toFixed(2);
}

function validatePlayerStats({ runs, balls, fours, sixes, name, team }) {
  // Check for integers
  if (!Number.isInteger(runs) || !Number.isInteger(balls) || 
      !Number.isInteger(fours) || !Number.isInteger(sixes)) {
    return { valid: false, message: "Runs, balls, 4s and 6s must be whole numbers." };
  }

  if (runs < 0 || balls < 0 || fours < 0 || sixes < 0) {
    return { valid: false, message: "Runs, balls, 4s and 6s cannot be negative." };
  }

  // Max values validation
  const MAX_RUNS = 500;
  const MAX_BALLS = 600;
  const MAX_BOUNDARIES = 100;
  
  if (runs > MAX_RUNS) {
    return { valid: false, message: `Runs cannot exceed ${MAX_RUNS}.` };
  }
  if (balls > MAX_BALLS) {
    return { valid: false, message: `Balls cannot exceed ${MAX_BALLS}.` };
  }
  if (fours > MAX_BOUNDARIES || sixes > MAX_BOUNDARIES) {
    return { valid: false, message: `Boundaries cannot exceed ${MAX_BOUNDARIES} each.` };
  }

  // Name validation
  if (name !== undefined) {
    if (!name || name.length < 2) {
      return { valid: false, message: "Player name must be at least 2 characters." };
    }
    if (name.length > 100) {
      return { valid: false, message: "Player name cannot exceed 100 characters." };
    }
  }

  // Team validation
  if (team !== undefined) {
    if (!team || team.length < 2) {
      return { valid: false, message: "Team name must be at least 2 characters." };
    }
    if (team.length > 100) {
      return { valid: false, message: "Team name cannot exceed 100 characters." };
    }
  }

  const boundaries = fours + sixes;

  if (balls === 0 && (runs > 0 || boundaries > 0)) {
    return { valid: false, message: "A player cannot score runs or boundaries without facing any balls." };
  }

  if (boundaries > balls) {
    return { valid: false, message: "Boundaries (4s + 6s) cannot exceed balls faced." };
  }

  const minRunsFromBoundaries = fours * 4 + sixes * 6;
  if (runs < minRunsFromBoundaries) {
    return { valid: false, message: "Total runs cannot be less than runs scored from boundaries." };
  }

  const maxRunsFromNonBoundaries = (balls - boundaries) * 3;
  const maxTotalRunsGivenBoundaries = minRunsFromBoundaries + Math.max(0, maxRunsFromNonBoundaries);
  if (runs > maxTotalRunsGivenBoundaries) {
    return { valid: false, message: "Given balls and boundaries, total runs are not possible." };
  }

  return { valid: true };
}

// Improved toast with limit
function showToast(message, type = "success") {
  const MAX_TOASTS = 5;
  const container = document.getElementById("toast-container");
  
  // Remove oldest toast if limit reached
  if (toastCount >= MAX_TOASTS) {
    const oldestToast = container.querySelector('.toast');
    if (oldestToast) {
      oldestToast.remove();
      toastCount--;
    }
  }
  
  const toast = document.createElement("div");
  toast.classList.add("toast");
  if (type === "error") toast.classList.add("error");
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message; // Safe from XSS
  
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('toast-close');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => {
    toast.remove();
    toastCount--;
  };
  
  toast.appendChild(messageSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);
  toastCount++;
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
      toastCount--;
    }
  }, 4000);
}


function setCurrentYearFooter() {
  document.getElementById("copyright-year").textContent = new Date().getFullYear();
}

function setupNavigation() {
  const links = document.querySelectorAll(".nav-menu a");
  const navMenu = document.querySelector(".nav-menu");
  
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const page = link.dataset.page;
      document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
      document.getElementById(page).classList.add("active");
      
      // Close mobile menu after navigation
      if (navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
      }
      
      if (page === "dashboard") {
        updatePOTM();
      }
    });
  });
  
  document.querySelector(".mobile-toggle").addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    
    // ESC - Close modals
    if (e.key === 'Escape') {
      const editModal = document.getElementById('edit-modal');
      const confirmModal = document.getElementById('confirm-modal');
      if (editModal && editModal.classList.contains('show')) {
        closeModal();
      } else if (confirmModal && confirmModal.classList.contains('show')) {
        closeConfirmModal();
      }
    }
    
    // Ctrl/Cmd + K - Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isInput) {
      e.preventDefault();
      const searchBox = document.getElementById('search-box');
      if (searchBox) {
        document.querySelector('[data-page="statistics"]').click();
        setTimeout(() => searchBox.focus(), 100);
      }
    }
    
    // Ctrl/Cmd + N - Add new player
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isInput) {
      e.preventDefault();
      document.querySelector('[data-page="add-player"]').click();
      setTimeout(() => document.getElementById('player-name').focus(), 100);
    }
    
    // Ctrl/Cmd + / - Show shortcuts help
    if ((e.ctrlKey || e.metaKey) && e.key === '/' && !isInput) {
      e.preventDefault();
      showToast('Shortcuts: Ctrl+K (Search), Ctrl+N (New Player), ESC (Close)');
    }
  });
}

document.getElementById("player-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("player-name").value.trim();
  const team = document.getElementById("team").value.trim();
  const runs = parseInt(document.getElementById("runs").value) || 0;
  const balls = parseInt(document.getElementById("balls").value) || 0;
  const fours = parseInt(document.getElementById("fours").value) || 0;
  const sixes = parseInt(document.getElementById("sixes").value) || 0;
  const format = document.getElementById("match-type").value;

  const validation = validatePlayerStats({ runs, balls, fours, sixes, name, team });
  if (!validation.valid) {
    showToast(validation.message, "error");
    return;
  }

  // Check for duplicates (same name, team, format, and stats)
  const isDuplicate = players.some(p => 
    p.name === name && p.team === team && p.format === format &&
    p.runs === runs && p.balls === balls && p.fours === fours && p.sixes === sixes
  );
  
  if (isDuplicate) {
    showToast("This player with identical stats already exists!", "error");
    return;
  }

  const sr = calculateStrikeRate(runs, balls);

  players.push({
    id: generateId(),
    name,
    team,
    runs,
    balls,
    fours,
    sixes,
    format,
    strikeRate: sr
  });

  savePlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  updatePOTM();
  updateLeaderboard("runs");
  showToast("Player added successfully!");
  e.target.reset();
});

function stepUp(id) {
  const input = document.getElementById(id);
  input.stepUp();
  input.dispatchEvent(new Event("input"));
}

function stepDown(id) {
  const input = document.getElementById(id);
  input.stepDown();
  input.dispatchEvent(new Event("input"));
}

function initDropdowns() {
  populateAllCustomDropdowns();
  document.addEventListener("click", (e) => {
    const clickedDropdown = e.target.closest(".custom-dropdown");
    document.querySelectorAll(".custom-dropdown").forEach(drop => {
      if (drop !== clickedDropdown) {
        drop.classList.remove("open");
        const list = drop.querySelector(".dropdown-list");
        if (list) list.style.display = "none";
      }
    });
    if (clickedDropdown) {
      clickedDropdown.classList.toggle("open");
      const list = clickedDropdown.querySelector(".dropdown-list");
      if (list) {
        list.style.display = clickedDropdown.classList.contains("open") ? "block" : "none";
      }
    }
  });
}

function populateAllCustomDropdowns() {
  document.querySelectorAll(".custom-dropdown").forEach(drop => {
    const selectId = drop.dataset.for;
    const select = document.getElementById(selectId);
    if (!select) return;
    buildCustomDropdown(drop, select);
  });
}

function buildCustomDropdown(dropdown, select) {
  const selectedOption = select.options[select.selectedIndex];
  dropdown.innerHTML = `
    <div class="dropdown-selected">
      <span>${selectedOption?.textContent || "Select option"}</span>
      <span class="caret">▼</span>
    </div>
    <div class="dropdown-list"></div>
  `;
  const list = dropdown.querySelector(".dropdown-list");
  list.innerHTML = "";
  [...select.options].forEach(opt => {
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    if (opt.value === select.value) item.classList.add("active");
    item.dataset.value = opt.value;
    item.textContent = opt.textContent;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      select.value = opt.value;
      dropdown.querySelector(".dropdown-selected span").textContent = opt.textContent;
      list.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      select.dispatchEvent(new Event("change"));
      dropdown.classList.remove("open");
      list.style.display = "none";
    });
    list.appendChild(item);
  });
}

function calculatePlayerScore(player) {
  const runsScore = player.runs * 1.0;
  const strikeRateScore = parseFloat(player.strikeRate) * 0.5;
  const boundaryScore = (player.fours * 0.5) + (player.sixes * 1.0);
  return runsScore + strikeRateScore + boundaryScore;
}

function findBestPlayer() {
  if (players.length === 0) return null;

  let bestPlayer = players[0];
  let bestScore = calculatePlayerScore(players[0]);

  for (let i = 1; i < players.length; i++) {
    const currentScore = calculatePlayerScore(players[i]);
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestPlayer = players[i];
    }
  }

  return bestPlayer;
}

function updatePOTM() {
  const display = document.getElementById("potm-display");
  const bestPlayer = findBestPlayer();

  // Clear existing content
  display.innerHTML = '';

  if (!bestPlayer) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'potm-empty';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-trophy';
    
    const text = document.createElement('p');
    text.textContent = 'No players added yet. Add players to see the Best Performer.';
    
    emptyDiv.appendChild(icon);
    emptyDiv.appendChild(text);
    display.appendChild(emptyDiv);
    return;
  }

  // Create POTM card safely
  const card = document.createElement('div');
  card.className = 'potm-card';
  
  const nameDiv = document.createElement('div');
  nameDiv.className = 'name';
  nameDiv.textContent = bestPlayer.name;
  
  const teamDiv = document.createElement('div');
  teamDiv.className = 'team';
  teamDiv.textContent = `${bestPlayer.team} – ${bestPlayer.format}`;
  
  const statsDiv = document.createElement('div');
  statsDiv.className = 'potm-stats';
  
  // Helper function to create stat
  const createStat = (value, label) => {
    const statDiv = document.createElement('div');
    statDiv.className = 'potm-stat';
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'potm-stat-value';
    valueDiv.textContent = value;
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'potm-stat-label';
    labelDiv.textContent = label;
    
    statDiv.appendChild(valueDiv);
    statDiv.appendChild(labelDiv);
    return statDiv;
  };
  
  statsDiv.appendChild(createStat(bestPlayer.runs, 'Runs'));
  statsDiv.appendChild(createStat(bestPlayer.balls, 'Balls'));
  statsDiv.appendChild(createStat(bestPlayer.strikeRate, 'Strike Rate'));
  statsDiv.appendChild(createStat(bestPlayer.fours + bestPlayer.sixes, 'Boundaries'));
  
  card.appendChild(nameDiv);
  card.appendChild(teamDiv);
  card.appendChild(statsDiv);
  display.appendChild(card);
}

function updateDashboardStats() {
  let totalRuns = 0;
  let totalSR = 0;
  let totalBoundaries = 0;

  players.forEach(p => {
    totalRuns += p.runs;
    totalSR += parseFloat(p.strikeRate);
    totalBoundaries += p.fours + p.sixes;
  });

  document.getElementById("total-players").textContent = players.length;
  document.getElementById("total-runs").textContent = totalRuns;
  document.getElementById("avg-strike-rate").textContent =
    players.length ? (totalSR / players.length).toFixed(2) : 0;
  document.getElementById("total-boundaries").textContent = totalBoundaries;
}

function updateTable() {
  const tbody = document.getElementById("scorecard-body");
  tbody.innerHTML = "";

  const filter = document.getElementById("match-filter").value;
  const search = document.getElementById("search-box").value.toLowerCase();

  players.forEach((p) => {
    if (filter !== "all" && p.format !== filter) return;
    // Search by name or team
    if (!p.name.toLowerCase().includes(search) && !p.team.toLowerCase().includes(search)) return;

    const tr = document.createElement("tr");
    
    // Create cells safely
    const createCell = (text) => {
      const td = document.createElement('td');
      td.textContent = text;
      return td;
    };
    
    tr.appendChild(createCell(p.name));
    tr.appendChild(createCell(p.team));
    tr.appendChild(createCell(p.format));
    tr.appendChild(createCell(p.runs));
    tr.appendChild(createCell(p.balls));
    tr.appendChild(createCell(p.fours));
    tr.appendChild(createCell(p.sixes));
    tr.appendChild(createCell(p.strikeRate));
    
    // Actions cell
    const actionsCell = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = () => openModalById(p.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => confirmDeletePlayerById(p.id);
    
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
    tr.appendChild(actionsCell);
    
    tbody.appendChild(tr);
  });
  
  // Show empty state if no results
  if (tbody.children.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.style.textAlign = 'center';
    td.style.padding = '2rem';
    td.textContent = players.length === 0 ? 'No players added yet' : 'No players match your search';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

function setupSearchFilter() {
  // Debounced search
  document.getElementById("search-box").addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(updateTable, 300);
  });
  
  document.getElementById("match-filter").addEventListener("change", () => {
    updateTable();
  });
}

function showConfirmModal(title, message, callback) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = message;
  confirmCallback = callback;
  document.getElementById("confirm-modal").classList.add("show");
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").classList.remove("show");
  confirmCallback = null;
}

function executeConfirmAction() {
  if (confirmCallback) {
    confirmCallback();
  }
  closeConfirmModal();
}

// Find player by ID
function findPlayerById(id) {
  return players.find(p => p.id === id);
}

function findPlayerIndexById(id) {
  return players.findIndex(p => p.id === id);
}

function confirmDeletePlayerById(id) {
  const player = findPlayerById(id);
  if (!player) return;
  
  showConfirmModal(
    "Delete Player",
    `Are you sure you want to delete ${player.name}? You can undo this action.`,
    () => deletePlayerById(id)
  );
}

function deletePlayerById(id) {
  const index = findPlayerIndexById(id);
  if (index === -1) return;
  
  // Store for undo
  const deletedPlayer = players[index];
  deletedPlayers.push(deletedPlayer);
  if (deletedPlayers.length > 10) deletedPlayers.shift(); // Keep last 10
  
  players.splice(index, 1);
  savePlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  updatePOTM();
  updateLeaderboard("runs");
  showToast("Player deleted! Refresh page to undo if needed.");
}

// Legacy functions for backwards compatibility
function confirmDeletePlayer(index) {
  if (players[index]) {
    confirmDeletePlayerById(players[index].id);
  }
}

function deletePlayer(index) {
  if (players[index]) {
    deletePlayerById(players[index].id);
  }
}

function confirmClearAll() {
  if (players.length === 0) {
    showToast("No players to clear!", "error");
    return;
  }
  showConfirmModal(
    "Clear All Data",
    "Are you sure you want to delete ALL player data? This action cannot be undone!",
    clearAll
  );
}

function clearAll() {
  players = [];
  savePlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  updatePOTM();
  updateLeaderboard("runs");
  showToast("All players cleared!", "error");
}

function openModalById(id) {
  const p = findPlayerById(id);
  if (!p) return;
  
  document.getElementById("edit-index").value = p.id; // Store ID, not index
  document.getElementById("edit-name").value = p.name;
  document.getElementById("edit-team").value = p.team;
  document.getElementById("edit-runs").value = p.runs;
  document.getElementById("edit-balls").value = p.balls;
  document.getElementById("edit-fours").value = p.fours;
  document.getElementById("edit-sixes").value = p.sixes;
  document.getElementById("edit-match-type").value = p.format;
  populateAllCustomDropdowns();
  document.getElementById("edit-modal").classList.add("show");
}

// Legacy support
function openModal(index) {
  if (players[index]) {
    openModalById(players[index].id);
  }
}

function closeModal() {
  document.getElementById("edit-modal").classList.remove("show");
}

document.getElementById("edit-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const playerId = document.getElementById("edit-index").value;
  const index = findPlayerIndexById(playerId);
  
  if (index === -1) {
    showToast("Player not found!", "error");
    closeModal();
    return;
  }
  
  const name = document.getElementById("edit-name").value.trim();
  const team = document.getElementById("edit-team").value.trim();
  const runs = parseInt(document.getElementById("edit-runs").value) || 0;
  const balls = parseInt(document.getElementById("edit-balls").value) || 0;
  const fours = parseInt(document.getElementById("edit-fours").value) || 0;
  const sixes = parseInt(document.getElementById("edit-sixes").value) || 0;
  const format = document.getElementById("edit-match-type").value;

  const validation = validatePlayerStats({ runs, balls, fours, sixes, name, team });
  if (!validation.valid) {
    showToast(validation.message, "error");
    return;
  }

  const sr = calculateStrikeRate(runs, balls);

  players[index] = {
    ...players[index], // Preserve ID
    name,
    team,
    runs,
    balls,
    fours,
    sixes,
    format,
    strikeRate: sr
  };

  savePlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  updatePOTM();
  updateLeaderboard("runs");
  closeModal();
  showToast("Player updated!");
});

document.getElementById("csv-input").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n").map(l => l.trim()).filter(Boolean);
    let imported = 0;
    const errors = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes("name")) return;
      
      // Better CSV parsing (handles quoted fields)
      const fields = line.match(/('([^']*)'|"([^"]*)"|[^,]+)/g) || [];
      const [name, team, runs, balls, fours, sixes, format] = fields.map(s => s.trim().replace(/^[""]/, '').replace(/[""]$/, ''));
      
      if (!name || !format) {
        errors.push(`Line ${idx + 1}: Missing name or format`);
        return;
      }

      const runsVal = Number(runs) || 0;
      const ballsVal = Number(balls) || 0;
      const foursVal = Number(fours) || 0;
      const sixesVal = Number(sixes) || 0;

      const validation = validatePlayerStats({ 
        runs: runsVal, 
        balls: ballsVal, 
        fours: foursVal, 
        sixes: sixesVal,
        name,
        team: team || "Unknown"
      });
      
      if (!validation.valid) {
        errors.push(`Line ${idx + 1}: ${validation.message}`);
        return;
      }

      const sr = calculateStrikeRate(runsVal, ballsVal);
      players.push({
        id: generateId(),
        name,
        team: team || "Unknown",
        runs: runsVal,
        balls: ballsVal,
        fours: foursVal,
        sixes: sixesVal,
        format,
        strikeRate: sr
      });
      imported++;
    });

    savePlayers();
    updateDashboardStats();
    updateTable();
    updateCharts();
    updatePOTM();
    updateLeaderboard("runs");
    
    let message = `CSV imported! ${imported} players added.`;
    if (errors.length > 0) {
      message += ` ${errors.length} errors encountered.`;
      console.log('CSV Import Errors:', errors);
      showToast(message, errors.length > imported ? 'error' : 'success');
    } else {
      showToast(message);
    }
  };
  reader.readAsText(file);
  this.value = "";
});


function updateCharts() {
  if (players.length === 0) {
    if (charts.runs) charts.runs.destroy();
    if (charts.strike) charts.strike.destroy();
    if (charts.boundaries) charts.boundaries.destroy();
    return;
  }

  const names = players.map(p => p.name);
  const runs = players.map(p => p.runs);
  const strikeRates = players.map(p => parseFloat(p.strikeRate));
  const boundaries = players.map(p => p.fours + p.sixes);

  if (charts.runs) charts.runs.destroy();
  charts.runs = new Chart(document.getElementById("runsChart"), {
    type: "bar",
    data: {
      labels: names,
      datasets: [{
        label: "Runs",
        data: runs,
        backgroundColor: "#00ff88",
        borderColor: "#00cc6a",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        title: {
          display: true,
          text: 'Runs Scored by Players',
          color: '#00ff88',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });

  if (charts.strike) charts.strike.destroy();
  charts.strike = new Chart(document.getElementById("strikeChart"), {
    type: "line",
    data: {
      labels: names,
      datasets: [{
        label: "Strike Rate",
        data: strikeRates,
        borderColor: "#0066ff",
        backgroundColor: "rgba(0, 102, 255, 0.1)",
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        title: {
          display: true,
          text: 'Strike Rate Comparison',
          color: '#0066ff',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });

  if (charts.boundaries) charts.boundaries.destroy();
  charts.boundaries = new Chart(document.getElementById("boundaryChart"), {
    type: "bar",
    data: {
      labels: names,
      datasets: [{
        label: "Boundaries",
        data: boundaries,
        backgroundColor: "#ff0066",
        borderColor: "#cc0055",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        title: {
          display: true,
          text: 'Total Boundaries (4s + 6s)',
          color: '#ff0066',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });
}

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateLeaderboard(btn.dataset.filter);
  });
});

function updateLeaderboard(metric = "runs") {
  if (players.length === 0) {
    document.getElementById("leaderboard-list").innerHTML = 
      '<div style="text-align:center;padding:2rem;color:var(--text-muted);">No players added yet</div>';
    ["podium-1", "podium-2", "podium-3"].forEach(id => {
      const pod = document.getElementById(id);
      pod.querySelector(".podium-name").textContent = "-";
      pod.querySelector(".podium-score").textContent = "0";
    });
    return;
  }

  let sorted = [...players];
  if (metric === "runs") {
    sorted.sort((a, b) => b.runs - a.runs);
  } else if (metric === "strike-rate") {
    sorted.sort((a, b) => parseFloat(b.strikeRate) - parseFloat(a.strikeRate));
  } else if (metric === "boundaries") {
    sorted.sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes));
  } else if (metric === "boundary-percent") {
    sorted.sort((a, b) => {
      const aPerc = a.balls > 0 ? (a.fours + a.sixes) / a.balls : 0;
      const bPerc = b.balls > 0 ? (b.fours + b.sixes) / b.balls : 0;
      return bPerc - aPerc;
    });
  }

  const podiumIds = ["podium-1", "podium-2", "podium-3"];
  sorted.slice(0, 3).forEach((p, i) => {
    const pod = document.getElementById(podiumIds[i]);
    pod.querySelector(".podium-name").textContent = p.name;
    let score;
    if (metric === "runs") score = p.runs;
    else if (metric === "strike-rate") score = p.strikeRate;
    else if (metric === "boundaries") score = p.fours + p.sixes;
    else score = ((p.fours + p.sixes) / (p.balls || 1)).toFixed(2);
    pod.querySelector(".podium-score").textContent = score;
  });

  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  sorted.forEach((p, rank) => {
    const row = document.createElement("div");
    row.classList.add("leaderboard-item");
    let score;
    if (metric === "runs") score = p.runs;
    else if (metric === "strike-rate") score = p.strikeRate;
    else if (metric === "boundaries") score = p.fours + p.sixes;
    else score = ((p.fours + p.sixes) / (p.balls || 1)).toFixed(2);
    row.innerHTML = `
      <div>${rank + 1}. ${p.name}</div>
      <div><strong>${score}</strong></div>
    `;
    list.appendChild(row);
  });
}

document.getElementById("ai-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("ai-input");
  const text = input.value.trim();
  if (!text) return;

  addChatMessage(text, "user");
  const response = generateAIResponse(text);
  addChatMessage(response, "ai");
  input.value = "";
});

function addChatMessage(msg, sender) {
  const chat = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.classList.add("message", sender === "ai" ? "ai-message" : "user-message");
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function generateAIResponse(query) {
  query = query.toLowerCase();
  if (players.length === 0) {
    return "No player data available yet. Add some players first!";
  }

  if (query.includes("top") && (query.includes("run") || query.includes("scorer"))) {
    const sorted = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
    return "Top Run Scorers:\n" + sorted.map((p, i) => `${i+1}. ${p.name} - ${p.runs} runs`).join("\n");
  }
  if (query.includes("strike")) {
    const sorted = [...players].sort((a, b) => parseFloat(b.strikeRate) - parseFloat(a.strikeRate)).slice(0, 5);
    return "Top Strike Rates:\n" + sorted.map((p, i) => `${i+1}. ${p.name} - ${p.strikeRate} SR`).join("\n");
  }
  if (query.includes("boundary") || query.includes("boundaries")) {
    const sorted = [...players]
      .sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes))
      .slice(0, 5);
    return "Top Boundary Hitters:\n" + sorted.map((p, i) => `${i+1}. ${p.name} - ${p.fours + p.sixes} boundaries`).join("\n");
  }
  if (query.includes("compare")) {
    return "To compare players, view the Analytics section for detailed charts and comparisons!";
  }
  if (query.includes("best") && (query.includes("performer") || query.includes("player"))) {
      const bestPlayer = findBestPlayer();
      if (bestPlayer) {
          const score = calculatePlayerScore(bestPlayer);
          return `The Best Performer is ${bestPlayer.name} (${bestPlayer.team}) with a calculated score of ${score.toFixed(2)}.`;
      } else {
          return "No players added yet.";
      }
  }
  if (query.includes("help") || query.includes("what can you do")) {
    return "I can help with:\n• Top scorers\n• Strike rate leaders\n• Boundary stats\n• Player comparisons\n• Identifying the Best Performer\nTry asking: 'Show top 5 scorers' or 'Who is the best performer?'";
  }
  return "I can help with:\n• Top scorers\n• Strike rate leaders\n• Boundary stats\n• Player comparisons\n• Identifying the Best Performer\nAsk me something specific!";
}

document.addEventListener("DOMContentLoaded", () => {
  loadPlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  initDropdowns();
  setupNavigation();
  setupSearchFilter();
  setCurrentYearFooter();
  updateLeaderboard("runs");
  updatePOTM();
});
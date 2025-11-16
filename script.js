/* ==========================================================
   CRICKET PERFORMANCE ANALYZER – FULL SCRIPT.JS
   ========================================================== */

/* ---------- GLOBAL VARIABLES ---------- */
let players = [];
let charts = {
  runs: null,
  strike: null,
  boundaries: null
};
let confirmCallback = null;

/* ---------- INITIAL LOAD ---------- */
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
  populatePOTMDropdown(); // Initialize POTM dropdown on load
});

/* ==========================================================
   UTILITY FUNCTIONS
   ========================================================== */

function loadPlayers() {
  const data = localStorage.getItem("players");
  players = data ? JSON.parse(data) : [];
}

function savePlayers() {
  localStorage.setItem("players", JSON.stringify(players));
}

function calculateStrikeRate(runs, balls) {
  return balls === 0 ? 0 : ((runs / balls) * 100).toFixed(2);
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast");
  if (type === "error") toast.classList.add("error");

  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setCurrentYearFooter() {
  document.getElementById("copyright-year").textContent = new Date().getFullYear();
}

/* ==========================================================
   NAVIGATION BETWEEN SECTIONS
   ========================================================== */
function setupNavigation() {
  const links = document.querySelectorAll(".nav-menu a");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      const page = link.dataset.page;
      document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
      document.getElementById(page).classList.add("active");
    });
  });

  document.querySelector(".mobile-toggle").addEventListener("click", () => {
    document.querySelector(".nav-menu").classList.toggle("active");
  });
}

/* ==========================================================
   ADD PLAYER (FORM SUBMISSION)
   ========================================================== */
document.getElementById("player-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("player-name").value.trim();
  const team = document.getElementById("team").value.trim();
  const runs = parseInt(document.getElementById("runs").value) || 0;
  const balls = parseInt(document.getElementById("balls").value) || 0;
  const fours = parseInt(document.getElementById("fours").value) || 0;
  const sixes = parseInt(document.getElementById("sixes").value) || 0;
  const format = document.getElementById("match-type").value;

  const sr = calculateStrikeRate(runs, balls);

  players.push({
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
  populatePOTMDropdown();
  updateLeaderboard("runs");

  showToast("Player added successfully!");

  e.target.reset();
});

/* ==========================================================
   CUSTOM NUMBER SPINNER BUTTONS
   ========================================================== */
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

/* ==========================================================
   CUSTOM DROPDOWN ENGINE
   ========================================================== */

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
      e.stopPropagation(); // Prevent event bubbling
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

/* ==========================================================
   POPULATE PLAYER OF THE MATCH DROPDOWN
   ========================================================== */
function populatePOTMDropdown() {
  const select = document.getElementById("potm-select");
  if (!select) return;
  
  // Store current value
  const currentValue = select.value;
  
  select.innerHTML = `<option value="">-- Select Star Player --</option>`;

  players.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${p.name} (${p.runs} runs, SR ${p.strikeRate})`;
    select.appendChild(opt);
  });

  // Restore previous selection if still valid
  if (currentValue && players[currentValue]) {
    select.value = currentValue;
  }

  // Force rebuild the custom dropdown
  const dropdown = document.querySelector('[data-for="potm-select"]');
  if (dropdown) {
    buildCustomDropdown(dropdown, select);
  }
}

/* ==========================================================
   PLAYER OF THE MATCH (POTM)
   ========================================================== */
function setPlayerOfMatch() {
  const index = document.getElementById("potm-select").value;
  const display = document.getElementById("potm-display");

  if (index === "") {
    display.innerHTML = `
      <div class="potm-empty">
        <i class="fas fa-trophy"></i>
        <p>Select a player to highlight as Player of the Match</p>
      </div>`;
    return;
  }

  const p = players[index];

  display.innerHTML = `
    <div class="potm-card">
      <div class="name">${p.name}</div>
      <div class="team">${p.team} – ${p.format}</div>

      <div class="potm-stats">
        <div class="potm-stat">
          <div class="potm-stat-value">${p.runs}</div>
          <div class="potm-stat-label">Runs</div>
        </div>

        <div class="potm-stat">
          <div class="potm-stat-value">${p.balls}</div>
          <div class="potm-stat-label">Balls</div>
        </div>

        <div class="potm-stat">
          <div class="potm-stat-value">${p.strikeRate}</div>
          <div class="potm-stat-label">Strike Rate</div>
        </div>

        <div class="potm-stat">
          <div class="potm-stat-value">${p.fours + p.sixes}</div>
          <div class="potm-stat-label">Boundaries</div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================
   UPDATE DASHBOARD STATS
   ========================================================== */
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

/* ==========================================================
   UPDATE SCORECARD TABLE
   ========================================================== */
function updateTable() {
  const tbody = document.getElementById("scorecard-body");
  tbody.innerHTML = "";

  const filter = document.getElementById("match-filter").value;
  const search = document.getElementById("search-box").value.toLowerCase();

  players.forEach((p, index) => {
    if (filter !== "all" && p.format !== filter) return;
    if (!p.name.toLowerCase().includes(search)) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.team}</td>
      <td>${p.format}</td>
      <td>${p.runs}</td>
      <td>${p.balls}</td>
      <td>${p.fours}</td>
      <td>${p.sixes}</td>
      <td>${p.strikeRate}</td>
      <td>
        <button class="action-btn edit-btn" onclick="openModal(${index})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" onclick="confirmDeletePlayer(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ==========================================================
   SEARCH + FILTER SYSTEM
   ========================================================== */
function setupSearchFilter() {
  document.getElementById("search-box").addEventListener("input", updateTable);
  document.getElementById("match-filter").addEventListener("change", () => {
    updateTable();
  });
}

/* ==========================================================
   CONFIRMATION MODAL SYSTEM
   ========================================================== */
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

/* ==========================================================
   DELETE PLAYER
   ========================================================== */
function confirmDeletePlayer(index) {
  showConfirmModal(
    "Delete Player",
    `Are you sure you want to delete ${players[index].name}? This action cannot be undone.`,
    () => deletePlayer(index)
  );
}

function deletePlayer(index) {
  players.splice(index, 1);
  savePlayers();
  updateDashboardStats();
  updateTable();
  updateCharts();
  populatePOTMDropdown();
  updateLeaderboard("runs");

  showToast("Player deleted!");
}

/* ==========================================================
   CLEAR ALL PLAYERS
   ========================================================== */
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
  populatePOTMDropdown();
  updateLeaderboard("runs");

  showToast("All players cleared!", "error");
}

/* ==========================================================
   OPEN EDIT MODAL
   ========================================================== */
function openModal(index) {
  const p = players[index];

  document.getElementById("edit-index").value = index;
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

/* ==========================================================
   CLOSE MODAL
   ========================================================== */
function closeModal() {
  document.getElementById("edit-modal").classList.remove("show");
}

/* ==========================================================
   SAVE EDITED PLAYER
   ========================================================== */
document.getElementById("edit-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const index = document.getElementById("edit-index").value;

  const name = document.getElementById("edit-name").value.trim();
  const team = document.getElementById("edit-team").value.trim();
  const runs = parseInt(document.getElementById("edit-runs").value) || 0;
  const balls = parseInt(document.getElementById("edit-balls").value) || 0;
  const fours = parseInt(document.getElementById("edit-fours").value) || 0;
  const sixes = parseInt(document.getElementById("edit-sixes").value) || 0;
  const format = document.getElementById("edit-match-type").value;

  const sr = calculateStrikeRate(runs, balls);

  players[index] = {
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
  populatePOTMDropdown();
  updateLeaderboard("runs");

  closeModal();
  showToast("Player updated!");
});

/* ==========================================================
   CSV IMPORT
   ========================================================== */
document.getElementById("csv-input").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n").map(l => l.trim()).filter(Boolean);

    let imported = 0;
    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes("name")) return; // Skip header
      
      const [name, team, runs, balls, fours, sixes, format] = line.split(",").map(s => s.trim());

      if (!name || !format) return;

      const sr = calculateStrikeRate(Number(runs) || 0, Number(balls) || 0);

      players.push({
        name,
        team: team || "Unknown",
        runs: Number(runs) || 0,
        balls: Number(balls) || 0,
        fours: Number(fours) || 0,
        sixes: Number(sixes) || 0,
        format,
        strikeRate: sr
      });
      imported++;
    });

    savePlayers();
    updateDashboardStats();
    updateTable();
    updateCharts();
    populatePOTMDropdown();
    updateLeaderboard("runs");

    showToast(`CSV imported! ${imported} players added.`);
  };

  reader.readAsText(file);
  this.value = ""; // Reset input
});

/* ==========================================================
   CSV EXPORT
   ========================================================== */
function downloadCSV() {
  if (players.length === 0) {
    showToast("No data to export!", "error");
    return;
  }

  let csv = "Name,Team,Runs,Balls,Fours,Sixes,Format,Strike Rate\n";

  players.forEach(p => {
    csv += `${p.name},${p.team},${p.runs},${p.balls},${p.fours},${p.sixes},${p.format},${p.strikeRate}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cricket_players.csv";
  a.click();

  URL.revokeObjectURL(url);

  showToast("CSV downloaded!");
}

/* ==========================================================
   ANALYTICS CHARTS (Chart.js)
   ========================================================== */

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

  /* Runs Chart */
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

  /* Strike Rate Chart */
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

  /* Boundaries Chart */
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

/* ==========================================================
   LEADERBOARD RANKING
   ========================================================== */

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
    
    // Reset podium
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

  /* Update Podium */
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

  /* Leaderboard List */
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

/* ==========================================================
   AI ASSISTANT (Simple Chat Logic)
   ========================================================== */

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

  if (query.includes("help") || query.includes("what can you do")) {
    return "I can help with:\n• Top scorers\n• Strike rate leaders\n• Boundary stats\n• Player comparisons\n\nTry asking: 'Show top 5 scorers' or 'Who has the best strike rate?'";
  }

  return "I can help with:\n• Top scorers\n• Strike rate leaders\n• Boundary stats\n• Player comparisons\n\nAsk me something specific!";
}
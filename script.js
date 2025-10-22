// ===== CRICKET PERFORMANCE ANALYZER PRO - PRODUCTION READY =====
// Global variables
let players = [];
let runsChart = null;
let strikeChart = null;
let boundaryChart = null;
let comparisonChart = null;
let filterTimeout = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Load saved data if available
  const savedPlayers = localStorage.getItem('cricketPlayers');
  if (savedPlayers) {
    try {
      players = JSON.parse(savedPlayers);
      // Validate player data
      players = players.filter(p => 
        typeof p.name === 'string' && 
        typeof p.runs === 'number' && p.runs >= 0 &&
        typeof p.balls === 'number' && p.balls >= 0
      );
    } catch (e) {
      players = [];
    }
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Update UI
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  populateTeamFilter();
  generateInsights();
  updateLeaderboard('runs');
  populatePlayerOfMatchSelect();

  // Show initial tab
  document.querySelector('#dashboard').style.display = 'block';
  
  // BUG #26 FIX: Set dynamic copyright year
  document.getElementById('copyright-year').textContent = new Date().getFullYear();
  
  // BUG #11 FIX: Add ESC key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // Close edit modal
      const editModal = document.getElementById('edit-modal');
      if (editModal && editModal.classList.contains('show')) {
        closeModal();
      }
      // Close onboarding modal
      const onboardingModal = document.getElementById('onboarding-modal');
      if (onboardingModal && onboardingModal.classList.contains('show')) {
        closeOnboarding();
      }
    }
  });
  
  // Show onboarding modal for first-time users
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
  if (!hasSeenOnboarding) {
    setTimeout(() => {
      document.getElementById('onboarding-modal').classList.add('show');
    }, 500);
  }
});

// Set up event listeners
function setupEventListeners() {
  // Player form
  document.getElementById('player-form').addEventListener('submit', addPlayer);
  
  // CSV import
  document.getElementById('csv-input').addEventListener('change', importCSV);
  
  // Search and filters
  document.getElementById('search-box').addEventListener('input', () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(filterTable, 300);
  });
  document.getElementById('match-filter').addEventListener('change', filterTable);
  document.getElementById('sort-by').addEventListener('change', filterTable);
  document.getElementById('team-filter').addEventListener('change', filterTable);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  
  // Comparison controls
  document.getElementById('player1-select').addEventListener('change', updateCompareButton);
  document.getElementById('player2-select').addEventListener('change', updateCompareButton);
  document.getElementById('compare-btn').addEventListener('click', comparePlayers);
  
  // AI assistant
  document.getElementById('ai-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAI();
  });
  
  // Edit form
  document.getElementById('edit-form').addEventListener('submit', saveEdit);
  
  // Clear all button
  // Already handled in clearAll function

  // Tab switching
  document.querySelectorAll('.tabs a').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const targetTab = e.target.getAttribute('href');
      
      // Destroy charts when leaving analytics tab
      if (document.querySelector('#analytics').style.display !== 'none' && targetTab !== '#analytics') {
        destroyAnalyticsCharts();
      }
      
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.querySelector(targetTab).style.display = 'block';
      document.querySelectorAll('.tabs a').forEach(a => a.classList.remove('active'));
      e.target.classList.add('active');
      
      // Auto-focus search in statistics tab
      if (targetTab === '#statistics') {
        document.getElementById('search-box').focus();
      }
      
      // Update leaderboard when switching to it
      if (targetTab === '#leaderboard') {
        updateLeaderboard('runs');
      }
    });
  });

  // Leaderboard filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const filter = e.currentTarget.getAttribute('data-filter');
      updateLeaderboard(filter);
    });
  });
}

// ===== ONBOARDING MODAL =====
function closeOnboarding() {
  document.getElementById('onboarding-modal').classList.remove('show');
  localStorage.setItem('hasSeenOnboarding', 'true');
  showToast('Welcome! Start by adding your first player', 'success', 4000);
}

// ===== INSIGHTS GENERATION =====
function generateInsights() {
  if (players.length === 0) {
    document.getElementById('top-performer').textContent = 'Add players to see insights';
    document.getElementById('highest-sr').textContent = 'Add players to see insights';
    document.getElementById('most-consistent').textContent = 'Add players to see insights';
    document.getElementById('boundary-king').textContent = 'Add players to see insights';
    return;
  }
  
  // Top Performer (highest runs)
  const topPerformer = players.reduce((max, p) => p.runs > max.runs ? p : max);
  document.getElementById('top-performer').textContent = `${topPerformer.name} - ${topPerformer.runs} runs`;
  
  // Highest Strike Rate
  const highestSR = players.reduce((max, p) => {
    const sr = calculateStrikeRate(p.runs, p.balls);
    const maxSr = calculateStrikeRate(max.runs, max.balls);
    if (sr === '∞') return p;
    if (maxSr === '∞') return max;
    return parseFloat(sr) > parseFloat(maxSr) ? p : max;
  });
  document.getElementById('highest-sr').textContent = `${highestSR.name} - ${calculateStrikeRate(highestSR.runs, highestSR.balls)}`;
  
  // Most Consistent (best boundary percentage)
  const mostConsistent = players.reduce((max, p) => {
    const bp = parseFloat(calculateBoundaryPercent(p.fours || 0, p.sixes || 0, p.runs));
    const maxBp = parseFloat(calculateBoundaryPercent(max.fours || 0, max.sixes || 0, max.runs));
    return bp > maxBp ? p : max;
  });
  document.getElementById('most-consistent').textContent = `${mostConsistent.name} - ${calculateBoundaryPercent(mostConsistent.fours || 0, mostConsistent.sixes || 0, mostConsistent.runs)}% boundaries`;
  
  // Boundary King (most boundaries)
  const boundaryKing = players.reduce((max, p) => {
    const total = (p.fours || 0) + (p.sixes || 0);
    const maxTotal = (max.fours || 0) + (max.sixes || 0);
    return total > maxTotal ? p : max;
  });
  document.getElementById('boundary-king').textContent = `${boundaryKing.name} - ${(boundaryKing.fours || 0) + (boundaryKing.sixes || 0)} boundaries`;
}

// ===== PLAYER OF THE MATCH FEATURE (BUG #4 FIX: Move before initialization) =====
function populatePlayerOfMatchSelect() {
  const select = document.getElementById('potm-select');
  if (!select) return; // Guard clause
  select.innerHTML = '<option value="">-- Choose Player --</option>';
  
  players.forEach((player, index) => {
    const option = document.createElement('option');
    option.value = index;
    const sr = calculateStrikeRate(player.runs, player.balls);
    option.textContent = `${player.name} - ${player.runs} runs (SR: ${sr})`;
    select.appendChild(option);
  });
}

function setPlayerOfMatch() {
  const select = document.getElementById('potm-select');
  const display = document.getElementById('potm-display');
  const selectedIndex = select.value;
  
  if (selectedIndex === '') {
    display.innerHTML = `
      <div class="potm-empty">
        <i class="fas fa-trophy"></i>
        <p>Select a player to highlight as Player of the Match</p>
      </div>
    `;
    return;
  }
  
  const player = players[selectedIndex];
  const sr = calculateStrikeRate(player.runs, player.balls);
  const boundaries = (player.fours || 0) + (player.sixes || 0);
  
  // BUG #8 FIX: Sanitize output
  const sanitizedName = sanitizeInput(player.name);
  const sanitizedTeam = sanitizeInput(player.team || 'No Team');
  
  display.innerHTML = `
    <div class="potm-card">
      <div class="potm-badge">⭐ Player of the Match ⭐</div>
      <div class="potm-player">
        <div class="potm-avatar">
          <i class="fas fa-crown"></i>
        </div>
        <div class="potm-name">${sanitizedName}</div>
        <div class="potm-team">${sanitizedTeam} • ${player.matchType || 'T20'}</div>
      </div>
      <div class="potm-stats-grid">
        <div class="potm-stat">
          <div class="potm-stat-value">${player.runs}</div>
          <div class="potm-stat-label">Runs</div>
        </div>
        <div class="potm-stat">
          <div class="potm-stat-value">${player.balls}</div>
          <div class="potm-stat-label">Balls</div>
        </div>
        <div class="potm-stat">
          <div class="potm-stat-value">${sr}</div>
          <div class="potm-stat-label">Strike Rate</div>
        </div>
        <div class="potm-stat">
          <div class="potm-stat-value">${player.fours || 0}</div>
          <div class="potm-stat-label">Fours</div>
        </div>
        <div class="potm-stat">
          <div class="potm-stat-value">${player.sixes || 0}</div>
          <div class="potm-stat-label">Sixes</div>
        </div>
        <div class="potm-stat">
          <div class="potm-stat-value">${boundaries}</div>
          <div class="potm-stat-label">Total Boundaries</div>
        </div>
      </div>
    </div>
  `;
  
  showToast(`🎉 ${sanitizedName} selected as Player of the Match!`, 'success', 3000);
}

// ===== LEADERBOARD =====
function updateLeaderboard(filterType = 'runs') {
  if (players.length === 0) {
    // Clear podium
    for (let i = 1; i <= 3; i++) {
      const podium = document.getElementById(`podium-${i}`);
      podium.querySelector('.podium-name').textContent = '-';
      podium.querySelector('.podium-score').textContent = '0';
    }
    document.getElementById('leaderboard-list').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No players added yet. Add players to see the leaderboard!</p>';
    return;
  }

  // Sort players based on filter
  let sortedPlayers = [...players];
  
  switch(filterType) {
    case 'runs':
      sortedPlayers.sort((a, b) => b.runs - a.runs);
      break;
    case 'strike-rate':
      sortedPlayers.sort((a, b) => {
        const srA = calculateStrikeRate(a.runs, a.balls);
        const srB = calculateStrikeRate(b.runs, b.balls);
        if (srA === '∞') return -1;
        if (srB === '∞') return 1;
        return parseFloat(srB) - parseFloat(srA);
      });
      break;
    case 'boundaries':
      sortedPlayers.sort((a, b) => 
        ((b.fours || 0) + (b.sixes || 0)) - ((a.fours || 0) + (a.sixes || 0))
      );
      break;
    case 'sixes':
      sortedPlayers.sort((a, b) => (b.sixes || 0) - (a.sixes || 0));
      break;
  }

  // Update podium (top 3)
  for (let i = 0; i < 3 && i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    const podium = document.getElementById(`podium-${i + 1}`);
    
    podium.querySelector('.podium-name').textContent = player.name;
    
    let score;
    switch(filterType) {
      case 'runs':
        score = player.runs;
        break;
      case 'strike-rate':
        score = calculateStrikeRate(player.runs, player.balls);
        break;
      case 'boundaries':
        score = (player.fours || 0) + (player.sixes || 0);
        break;
      case 'sixes':
        score = player.sixes || 0;
        break;
    }
    
    podium.querySelector('.podium-score').textContent = score;
  }

  // Update leaderboard list (rank 4+)
  const listContainer = document.getElementById('leaderboard-list');
  listContainer.innerHTML = '';

  if (sortedPlayers.length > 3) {
    for (let i = 3; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      item.style.animationDelay = `${(i - 3) * 0.05}s`;

      let mainStat, statLabel;
      switch(filterType) {
        case 'runs':
          mainStat = player.runs;
          statLabel = 'RUNS';
          break;
        case 'strike-rate':
          mainStat = calculateStrikeRate(player.runs, player.balls);
          statLabel = 'S/R';
          break;
        case 'boundaries':
          mainStat = (player.fours || 0) + (player.sixes || 0);
          statLabel = '4s+6s';
          break;
        case 'sixes':
          mainStat = player.sixes || 0;
          statLabel = 'SIXES';
          break;
      }

      item.innerHTML = `
        <div class="leaderboard-rank">${i + 1}</div>
        <div class="leaderboard-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${player.name}</div>
          <div class="leaderboard-team">${player.team || 'No Team'} • ${player.matchType || 'T20'}</div>
        </div>
        <div class="leaderboard-stats">
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${mainStat}</div>
            <div class="leaderboard-stat-label">${statLabel}</div>
          </div>
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${calculateStrikeRate(player.runs, player.balls)}</div>
            <div class="leaderboard-stat-label">S/R</div>
          </div>
          <div class="leaderboard-stat">
            <div class="leaderboard-stat-value">${(player.fours || 0) + (player.sixes || 0)}</div>
            <div class="leaderboard-stat-label">4s+6s</div>
          </div>
        </div>
      `;

      listContainer.appendChild(item);
    }
  } else {
    listContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Only top 3 players available</p>';
  }
}

// ===== PRINT STATS =====
function printStats() {
  const printWindow = window.open('', '', 'width=800,height=600');
  const statsHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cricket Performance Stats</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #7c3aed; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #7c3aed; color: white; }
        tr:nth-child(even) { background: #f2f2f2; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>🏏 Cricket Performance Analyzer - Stats Report</h1>
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Players:</strong> ${players.length}</p>
        <p><strong>Total Runs:</strong> ${players.reduce((sum, p) => sum + p.runs, 0)}</p>
        <p><strong>Total Boundaries:</strong> ${players.reduce((sum, p) => sum + (p.fours || 0) + (p.sixes || 0), 0)}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Team</th>
            <th>Type</th>
            <th>Runs</th>
            <th>Balls</th>
            <th>4s</th>
            <th>6s</th>
            <th>Strike Rate</th>
          </tr>
        </thead>
        <tbody>
          ${players.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.team || '-'}</td>
              <td>${p.matchType || 'T20'}</td>
              <td>${p.runs}</td>
              <td>${p.balls}</td>
              <td>${p.fours || 0}</td>
              <td>${p.sixes || 0}</td>
              <td>${calculateStrikeRate(p.runs, p.balls)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="text-align: center; color: #666; margin-top: 30px;">
        Generated by Cricket Performance Analyzer Pro - ${new Date().toLocaleString()}
      </p>
    </body>
    </html>
  `;
  
  printWindow.document.write(statsHTML);
  printWindow.document.close();
  printWindow.print();
  showToast('Stats prepared for printing', 'success');
}

// Custom Confirm Dialog
function customConfirm(message, title = 'Confirm Action', icon = '⚠️') {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirm-dialog');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const iconEl = document.getElementById('confirm-icon');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    titleEl.textContent = title;
    messageEl.textContent = message;
    iconEl.textContent = icon;
    dialog.classList.add('show');

    const handleYes = () => {
      dialog.classList.remove('show');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
      resolve(true);
    };

    const handleNo = () => {
      dialog.classList.remove('show');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
      resolve(false);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  });
}

// Custom Error Dialog
function showError(message) {
  const dialog = document.getElementById('error-dialog');
  const messageEl = document.getElementById('error-message');
  const okBtn = document.getElementById('error-ok');

  messageEl.textContent = message;
  dialog.classList.add('show');

  return new Promise((resolve) => {
    const handleOk = () => {
      dialog.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      resolve();
    };

    okBtn.addEventListener('click', handleOk);
  });
}

// Custom Number Input Controls
function incrementValue(id) {
  const input = document.getElementById(id);
  const currentValue = parseInt(input.value) || 0;
  input.value = currentValue + 1;
}

function decrementValue(id) {
  const input = document.getElementById(id);
  const currentValue = parseInt(input.value) || 0;
  const min = parseInt(input.getAttribute('min')) || 0;
  if (currentValue > min) {
    input.value = currentValue - 1;
  }
}

// Calculate metrics
function calculateStrikeRate(runs, balls) {
  if (balls === 0) return runs > 0 ? '∞' : '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

function calculateBoundaryPercent(fours, sixes, runs) {
  const boundaryRuns = (fours * 4) + (sixes * 6);
  return runs === 0 ? 0 : ((boundaryRuns / runs) * 100).toFixed(1);
}

// Validate player data
function validatePlayerData(player) {
  // Check for negative values
  if (player.runs < 0 || player.balls < 0 || (player.fours || 0) < 0 || (player.sixes || 0) < 0) {
    return "Runs, balls, fours, and sixes cannot be negative.";
  }
  
  // Check for impossible scenarios
  const maxPossibleRuns = (player.balls * 6) + ((player.fours || 0) * 4) + ((player.sixes || 0) * 6);
  if (player.runs > maxPossibleRuns) {
    return `Impossible scenario: ${player.runs} runs cannot be scored in ${player.balls} balls with ${player.fours || 0} fours and ${player.sixes || 0} sixes.`;
  }
  
  // Check for more boundaries than possible
  if ((player.fours || 0) + (player.sixes || 0) > player.balls) {
    return "Number of boundaries cannot exceed number of balls faced.";
  }
  
  return null;
}

// BUG #8 FIX: Sanitize user input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove any HTML tags and script content
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.trim();
}

// BUG #3 FIX: Check for duplicate players
function checkDuplicatePlayer(name, team, matchType) {
  return players.some(p => 
    p.name.toLowerCase() === name.toLowerCase() && 
    (p.team || '').toLowerCase() === (team || '').toLowerCase() &&
    p.matchType === matchType
  );
}

// BUG #6 FIX: Sanitize CSV output to prevent formula injection
function sanitizeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // Escape formula characters
  if (str.match(/^[=+\-@]/)) {
    return "'" + str;
  }
  // Escape quotes and wrap in quotes if contains comma/newline
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Update statistics summary
function updateStats() {
  document.getElementById('total-players').textContent = players.length;
  const totalRuns = players.reduce((sum, p) => sum + p.runs, 0);
  document.getElementById('total-runs').textContent = totalRuns;
  const avgSR = players.length > 0 
    ? (players.reduce((sum, p) => sum + (parseFloat(calculateStrikeRate(p.runs, p.balls)) || 0), 0) / players.length).toFixed(2)
    : 0;
  document.getElementById('avg-strike-rate').textContent = avgSR;
  const totalBoundaries = players.reduce((sum, p) => sum + (p.fours || 0) + (p.sixes || 0), 0);
  document.getElementById('total-boundaries').textContent = totalBoundaries;
}

// Update player table with filters
function updateTable() {
  populateTeamFilter();
  filterTable();
}

function populateTeamFilter() {
  const select = document.getElementById('team-filter');
  select.innerHTML = '<option value="all">All Teams</option>';
  const teams = [...new Set(players.map(p => p.team).filter(t => t))].sort();
  teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function clearFilters() {
  document.getElementById('search-box').value = '';
  document.getElementById('match-filter').value = 'all';
  document.getElementById('team-filter').value = 'all';
  document.getElementById('sort-by').value = 'name';
  filterTable();
}

function filterTable() {
  const searchValue = document.getElementById('search-box').value.toLowerCase();
  const matchType = document.getElementById('match-filter').value;
  const sortBy = document.getElementById('sort-by').value;
  const team = document.getElementById('team-filter').value;
  
  let filtered = [...players];
  
  // Apply search filter
  if (searchValue) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchValue)
    );
  }
  
  // Apply match type filter
  if (matchType !== 'all') {
    filtered = filtered.filter(p => p.matchType === matchType);
  }

  // Apply team filter
  if (team !== 'all') {
    filtered = filtered.filter(p => p.team === team);
  }
  
  // Apply sorting
  switch(sortBy) {
    case 'runs':
      filtered.sort((a, b) => b.runs - a.runs);
      break;
    case 'strike':
      filtered.sort((a, b) => {
        const srA = calculateStrikeRate(a.runs, a.balls);
        const srB = calculateStrikeRate(b.runs, b.balls);
        if (srA === '∞') return -1;
        if (srB === '∞') return 1;
        return parseFloat(srB) - parseFloat(srA);
      });
      break;
    case 'boundaries':
      filtered.sort((a, b) => 
        (b.fours || 0) + (b.sixes || 0) - (a.fours || 0) - (a.sixes || 0)
      );
      break;
    default:
      filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Render table
  const tbody = document.getElementById('scorecard-body');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.style.textAlign = 'center';
    td.style.padding = '30px';
    td.textContent = 'No players found';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    filtered.forEach((p, idx) => {
      const tr = document.createElement('tr');
      
      // Create player name cell
      const nameCell = document.createElement('td');
      const nameStrong = document.createElement('strong');
      nameStrong.textContent = p.name;
      nameCell.appendChild(nameStrong);
      
      // Create match type cell
      const matchCell = document.createElement('td');
      const matchSpan = document.createElement('span');
      matchSpan.style.color = 'var(--primary)';
      matchSpan.textContent = p.matchType || 'T20';
      matchCell.appendChild(matchSpan);
      
      // Create team cell
      const teamCell = document.createElement('td');
      teamCell.textContent = p.team || '-';
      
      // Create runs cell
      const runsCell = document.createElement('td');
      runsCell.textContent = p.runs;
      
      // Create balls cell
      const ballsCell = document.createElement('td');
      ballsCell.textContent = p.balls;
      
      // Create fours cell
      const foursCell = document.createElement('td');
      foursCell.textContent = p.fours || 0;
      
      // Create sixes cell
      const sixesCell = document.createElement('td');
      sixesCell.textContent = p.sixes || 0;
      
      // Create strike rate cell
      const srCell = document.createElement('td');
      const srStrong = document.createElement('strong');
      srStrong.textContent = calculateStrikeRate(p.runs, p.balls);
      srCell.appendChild(srStrong);
      
      // Create boundary % cell
      const boundaryCell = document.createElement('td');
      boundaryCell.textContent = `${calculateBoundaryPercent(p.fours || 0, p.sixes || 0, p.runs)}%`;
      
      // Create actions cell
      const actionsCell = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'action-btn edit-btn';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.onclick = () => editPlayer(players.indexOf(p));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn delete-btn';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = () => deletePlayer(players.indexOf(p));
      
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      
      // Append all cells to row
      tr.appendChild(nameCell);
      tr.appendChild(matchCell);
      tr.appendChild(teamCell);
      tr.appendChild(runsCell);
      tr.appendChild(ballsCell);
      tr.appendChild(foursCell);
      tr.appendChild(sixesCell);
      tr.appendChild(srCell);
      tr.appendChild(boundaryCell);
      tr.appendChild(actionsCell);
      
      tbody.appendChild(tr);
    });
  }
}

// Destroy analytics charts
function destroyAnalyticsCharts() {
  if (runsChart) runsChart.destroy();
  if (strikeChart) strikeChart.destroy();
  if (boundaryChart) boundaryChart.destroy();
  runsChart = null;
  strikeChart = null;
  boundaryChart = null;
}

// Get chart options with modern styling
function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
            weight: 500
          },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#7c3aed',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        }
      }
    }
  };
}

// Update charts
function updateCharts() {
  const topPlayers = [...players].sort((a, b) => b.runs - a.runs).slice(0, 10);
  
  // Show/hide no data message
  const noDataMessage = document.getElementById('no-data-message');
  const chartContainer = document.getElementById('chart-container');
  if (players.length === 0) {
    noDataMessage.style.display = 'block';
    chartContainer.style.display = 'none';
    return;
  } else {
    noDataMessage.style.display = 'none';
    chartContainer.style.display = 'grid';
  }
  
  // Destroy existing charts
  destroyAnalyticsCharts();
  
  // Runs Chart - Teal/Cyan
  const runsCtx = document.getElementById('runsChart').getContext('2d');
  runsChart = new Chart(runsCtx, {
    type: 'bar',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [{
        label: 'Runs',
        data: topPlayers.map(p => p.runs),
        backgroundColor: 'rgba(6, 182, 212, 0.7)',
        borderColor: 'rgba(6, 182, 212, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: getChartOptions()
  });
  
  // Strike Rate Chart - Coral/Orange
  const strikeCtx = document.getElementById('strikeChart').getContext('2d');
  strikeChart = new Chart(strikeCtx, {
    type: 'line',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [{
        label: 'Strike Rate',
        data: topPlayers.map(p => {
          const sr = calculateStrikeRate(p.runs, p.balls);
          return sr === '∞' ? 300 : parseFloat(sr);
        }),
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(249, 115, 22, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      ...getChartOptions(),
      scales: {
        y: {
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            },
            callback: function(value, index, values) {
              if (value >= 300) return '∞';
              return value;
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          }
        }
      }
    }
  });
  
  // Boundary Chart - Teal & Coral
  const boundaryCtx = document.getElementById('boundaryChart').getContext('2d');
  boundaryChart = new Chart(boundaryCtx, {
    type: 'bar',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [
        {
          label: 'Fours',
          data: topPlayers.map(p => p.fours || 0),
          backgroundColor: 'rgba(20, 184, 166, 0.7)',
          borderColor: 'rgba(20, 184, 166, 1)',
          borderWidth: 2,
          borderRadius: 8
        },
        {
          label: 'Sixes',
          data: topPlayers.map(p => p.sixes || 0),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    },
    options: getChartOptions()
  });
}

// Add player
function addPlayer(e) {
  e.preventDefault();
  
  // BUG #8 FIX: Sanitize inputs
  const rawName = document.getElementById('player-name').value.trim();
  const rawTeam = document.getElementById('team').value.trim();
  
  const player = {
    name: sanitizeInput(rawName),
    runs: parseInt(document.getElementById('runs').value) || 0,
    balls: parseInt(document.getElementById('balls').value) || 0,
    fours: parseInt(document.getElementById('fours').value) || 0,
    sixes: parseInt(document.getElementById('sixes').value) || 0,
    matchType: document.getElementById('match-type').value,
    team: sanitizeInput(rawTeam),
    createdAt: new Date().toISOString() // BUG #15 FIX: Add timestamp
  };
  
  // Validate player data
  const validationError = validatePlayerData(player);
  if (validationError) {
    showError(validationError);
    return;
  }
  
  // BUG #3 FIX: Check for duplicates
  if (checkDuplicatePlayer(player.name, player.team, player.matchType)) {
    const confirmed = confirm(`A player named "${player.name}" from ${player.team || 'Unknown Team'} (${player.matchType}) already exists. Add anyway?`);
    if (!confirmed) {
      return;
    }
  }
  
  players.push(player);
  savePlayers();
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  generateInsights();
  updateLeaderboard('runs');
  populatePlayerOfMatchSelect();
  e.target.reset();
  showToast(`Player "${player.name}" added successfully!`, 'success');
}

// Import CSV
function importCSV(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
      
      let newPlayers = [];
      let errors = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle quoted fields
        const fields = parseCSVLine(line);
        if (fields.length < 6) {
          errors.push(`Line ${i+1}: Invalid format`);
          continue;
        }
        
        const [name, runsStr, ballsStr, foursStr, sixesStr, matchType, team] = fields;
        const runs = parseInt(runsStr) || 0;
        const balls = parseInt(ballsStr) || 0;
        const fours = parseInt(foursStr) || 0;
        const sixes = parseInt(sixesStr) || 0;
        
        if (!name || isNaN(runs) || isNaN(balls)) {
          errors.push(`Line ${i+1}: Missing required fields`);
          continue;
        }
        
        const player = { 
          name: name.trim(), 
          runs, 
          balls, 
          fours, 
          sixes, 
          matchType: matchType?.trim() || 'T20',
          team: team?.trim() || ''
        };
        
        // Validate player
        const validationError = validatePlayerData(player);
        if (validationError) {
          errors.push(`Line ${i+1}: ${validationError}`);
          continue;
        }
        
        newPlayers.push(player);
      }
      
      if (newPlayers.length > 0) {
        players.push(...newPlayers);
        savePlayers();
        updateStats();
        updateTable();
        updateCharts();
        populateComparisonSelects();
        populatePlayerOfMatchSelect();
      }
      
      if (errors.length > 0) {
        showError(`Import completed with ${errors.length} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`);
      }
      
      // Reset file input
      e.target.value = '';
    };
    reader.readAsText(file);
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1] || '';
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields.map(field => field.trim().replace(/^"(.*)"$/, '$1'));
}

// Edit player
function editPlayer(idx) {
  const p = players[idx];
  document.getElementById('edit-index').value = idx;
  document.getElementById('edit-name').value = p.name;
  document.getElementById('edit-runs').value = p.runs;
  document.getElementById('edit-balls').value = p.balls;
  document.getElementById('edit-fours').value = p.fours || 0;
  document.getElementById('edit-sixes').value = p.sixes || 0;
  document.getElementById('edit-match-type').value = p.matchType || 'T20';
  document.getElementById('edit-team').value = p.team || '';
  document.getElementById('edit-modal').classList.add('show');
}

// Save edited player
function saveEdit(e) {
  e.preventDefault();
  const idx = parseInt(document.getElementById('edit-index').value);
  
  // BUG #8 & #9 FIX: Sanitize and validate inputs
  const rawName = document.getElementById('edit-name').value.trim();
  const rawTeam = document.getElementById('edit-team').value.trim();
  const runs = parseInt(document.getElementById('edit-runs').value) || 0;
  const balls = parseInt(document.getElementById('edit-balls').value) || 0;
  const fours = parseInt(document.getElementById('edit-fours').value) || 0;
  const sixes = parseInt(document.getElementById('edit-sixes').value) || 0;
  
  const player = {
    name: sanitizeInput(rawName),
    runs: Math.max(0, runs), // BUG #9 FIX: Prevent negative values
    balls: Math.max(0, balls),
    fours: Math.max(0, fours),
    sixes: Math.max(0, sixes),
    matchType: document.getElementById('edit-match-type').value,
    team: sanitizeInput(rawTeam),
    createdAt: players[idx].createdAt || new Date().toISOString(), // Preserve original timestamp
    updatedAt: new Date().toISOString() // BUG #15 FIX: Add update timestamp
  };
  
  // Validate player data
  const validationError = validatePlayerData(player);
  if (validationError) {
    showError(validationError);
    return;
  }
  
  players[idx] = player;
  savePlayers();
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  closeModal();
}

// Delete player
function deletePlayer(idx) {
  customConfirm(
    `Remove ${players[idx].name} from the statistics?`,
    'Delete Player',
    '🗑️'
  ).then(result => {
    if (result) {
      players.splice(idx, 1);
      savePlayers();
      updateStats();
      updateTable();
      updateCharts();
      populateComparisonSelects();
    }
  });
}

// Close modal
function closeModal() {
  document.getElementById('edit-modal').classList.remove('show');
}

// Clear all players
function clearAll() {
  customConfirm(
    'This will remove all player data. This action cannot be undone!',
    'Clear All Players',
    '🚨'
  ).then(result => {
    if (result) {
      players = [];
      savePlayers();
      updateStats();
      updateTable();
      updateCharts();
      populateComparisonSelects();
    }
  });
}

// Download CSV - BUG #6 & #17 FIX: CSV injection prevention + dynamic filename
function downloadCSV() {
  let csv = 'Name,Runs,Balls,Fours,Sixes,Strike Rate,Match Type,Team\n';
  players.forEach(p => {
    // BUG #6 FIX: Use sanitizeCSVField to prevent formula injection
    csv += `${sanitizeCSVField(p.name)},`;
    csv += `${p.runs},${p.balls},${p.fours || 0},${p.sixes || 0},`;
    csv += `${calculateStrikeRate(p.runs, p.balls)},`;
    csv += `${sanitizeCSVField(p.matchType || 'T20')},`;
    csv += `${sanitizeCSVField(p.team || '')}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // BUG #17 FIX: Dynamic filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  a.download = `cricket_stats_${timestamp}.csv`;
  
  a.click();
  URL.revokeObjectURL(url);
  
  showToast(`Exported ${players.length} players successfully!`, 'success', 3000);
}

// AI Assistant
function setAIQuery(query) {
  document.getElementById('ai-input').value = query;
  handleAI();
}

function handleAI() {
  const query = document.getElementById('ai-input').value.toLowerCase();
  const response = document.getElementById('ai-response');
  
  if (players.length === 0) {
    response.textContent = '📊 No player data available. Please add players first!';
    return;
  }

  // Normalize query for matching
  const normalizedQuery = query.replace(/[^a-z0-9\s]/g, '');
  
  if (normalizedQuery.includes('best strike rate') || normalizedQuery.includes('highest strike rate')) {
    const best = players.reduce((max, p) => {
      const sr = calculateStrikeRate(p.runs, p.balls);
      const maxSr = calculateStrikeRate(max.runs, max.balls);
      if (sr === '∞') return p;
      if (maxSr === '∞') return max;
      return parseFloat(sr) > parseFloat(maxSr) ? p : max;
    });
    response.textContent = `🎯 ${best.name} has the best strike rate of ${calculateStrikeRate(best.runs, best.balls)}!`;
  } else if (normalizedQuery.includes('top') && (normalizedQuery.includes('scorer') || normalizedQuery.includes('run'))) {
    const top = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
    response.textContent = `🏆 Top Scorers: ${top.map((p, i) => `${i + 1}. ${p.name} (${p.runs} runs)`).join(', ')}`;
  } else if (normalizedQuery.includes('average')) {
    const avgRuns = (players.reduce((sum, p) => sum + p.runs, 0) / players.length).toFixed(2);
    response.textContent = `📊 Average runs per player: ${avgRuns}`;
  } else if (normalizedQuery.includes('boundaries') || normalizedQuery.includes('sixes') || normalizedQuery.includes('fours')) {
    const most = players.reduce((max, p) => {
      const total = (p.fours || 0) + (p.sixes || 0);
      const maxTotal = (max.fours || 0) + (max.sixes || 0);
      return total > maxTotal ? p : max;
    });
    response.textContent = `🎪 ${most.name} hit the most boundaries with ${most.fours || 0} fours and ${most.sixes || 0} sixes!`;
  } else if (normalizedQuery.includes('compare')) {
    const names = players.map(p => p.name.toLowerCase());
    const mentioned = names.filter(name => normalizedQuery.includes(name.replace(/[^a-z0-9\s]/g, '')));
    if (mentioned.length >= 2) {
      const p1 = players.find(p => p.name.toLowerCase() === mentioned[0]);
      const p2 = players.find(p => p.name.toLowerCase() === mentioned[1]);
      response.textContent = `⚔️ ${p1.name}: ${p1.runs} runs (SR: ${calculateStrikeRate(p1.runs, p1.balls)}) vs ${p2.name}: ${p2.runs} runs (SR: ${calculateStrikeRate(p2.runs, p2.balls)})`;
    } else {
      response.textContent = '🤔 Please mention at least two player names to compare!';
    }
  } else if (normalizedQuery.includes('t20') || normalizedQuery.includes('odi') || normalizedQuery.includes('test')) {
    const format = normalizedQuery.includes('t20') ? 'T20' : normalizedQuery.includes('odi') ? 'ODI' : 'Test';
    const filtered = players.filter(p => p.matchType === format);
    if (filtered.length > 0) {
      const total = filtered.reduce((sum, p) => sum + p.runs, 0);
      response.textContent = `🏏 ${format} Stats: ${filtered.length} players, ${total} total runs`;
    } else {
      response.textContent = `No ${format} players found.`;
    }
  } else if (normalizedQuery.includes('team')) {
    const teamNameMatch = normalizedQuery.match(/team\s+(\w+)/i);
    if (teamNameMatch) {
      const teamName = teamNameMatch[1];
      const teamPlayers = players.filter(p => p.team?.toLowerCase() === teamName.toLowerCase());
      if (teamPlayers.length > 0) {
        const totalRuns = teamPlayers.reduce((sum, p) => sum + p.runs, 0);
        response.textContent = `🏏 Team ${teamName}: ${teamPlayers.length} players, ${totalRuns} total runs`;
      } else {
        response.textContent = `No players found for team ${teamName}.`;
      }
    } else {
      response.textContent = 'Please specify a team name, e.g., "team India".';
    }
  } else {
    response.textContent = '🤖 Try asking: "Who has the best strike rate?", "Top 5 run scorers", "Average runs", "Most boundaries", "Compare [player1] and [player2]", "Team [name]"';
  }
}

// Player Comparison
function populateComparisonSelects() {
  const player1Select = document.getElementById('player1-select');
  const player2Select = document.getElementById('player2-select');
  
  // Clear existing options except the first one
  player1Select.innerHTML = '<option value="">Select Player 1</option>';
  player2Select.innerHTML = '<option value="">Select Player 2</option>';
  
  // Add players to both selects
  players.forEach((player, index) => {
    const option1 = document.createElement('option');
    option1.value = index;
    option1.textContent = player.name;
    player1Select.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = index;
    option2.textContent = player.name;
    player2Select.appendChild(option2);
  });
  
  updateCompareButton();
}

function updateCompareButton() {
  const player1 = document.getElementById('player1-select').value;
  const player2 = document.getElementById('player2-select').value;
  const compareBtn = document.getElementById('compare-btn');
  
  compareBtn.disabled = !(player1 && player2 && player1 !== player2);
}

function comparePlayers() {
  const player1Index = document.getElementById('player1-select').value;
  const player2Index = document.getElementById('player2-select').value;
  
  if (!player1Index || !player2Index || player1Index === player2Index) return;
  
  const player1 = players[player1Index];
  const player2 = players[player2Index];
  
  // Show comparison chart container
  document.getElementById('comparison-chart-container').style.display = 'block';
  
  // Destroy existing comparison chart
  if (comparisonChart) comparisonChart.destroy();
  
  // Create comparison chart
  const ctx = document.getElementById('comparison-chart').getContext('2d');
  
  // Handle infinity values for strike rate
  const sr1 = calculateStrikeRate(player1.runs, player1.balls);
  const sr2 = calculateStrikeRate(player2.runs, player2.balls);
  
  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Runs', 'Balls', 'Fours', 'Sixes', 'Strike Rate'],
      datasets: [
        {
          label: player1.name,
          data: [
            player1.runs,
            player1.balls,
            player1.fours || 0,
            player1.sixes || 0,
            sr1 === '∞' ? 300 : parseFloat(sr1)
          ],
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 2,
          borderRadius: 8
        },
        {
          label: player2.name,
          data: [
            player2.runs,
            player2.balls,
            player2.fours || 0,
            player2.sixes || 0,
            sr2 === '∞' ? 300 : parseFloat(sr2)
          ],
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    },
    options: {
      ...getChartOptions(),
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            },
            callback: function(value, index, values) {
              if (value >= 300) return '∞';
              return value;
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          }
        }
      }
    }
  });
}

// Save players to localStorage
function savePlayers() {
  try {
    const dataString = JSON.stringify(players);
    // Check if we're approaching quota (5MB typical limit)
    if (dataString.length > 4.5 * 1024 * 1024) {
      showToast('Warning: Approaching storage limit. Consider exporting data.', 'warning', 5000);
    }
    localStorage.setItem('cricketPlayers', dataString);
  } catch (e) {
    // Handle localStorage quota exceeded
    if (e.name === 'QuotaExceededError') {
      showError('Storage limit exceeded! Please export data and clear some players.');
    } else {
      showError('Failed to save data: ' + e.message);
    }
    console.error('Save error:', e);
  }
}

// ===== TOAST NOTIFICATION SYSTEM =====
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  
  // BUG #21 FIX: Limit toast stacking (max 3 visible toasts)
  const existingToasts = container.querySelectorAll('.toast');
  if (existingToasts.length >= 3) {
    // Remove oldest toast
    existingToasts[0].remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  };
  
  // BUG #8 FIX: Sanitize message
  const sanitizedMessage = sanitizeInput(message);
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${sanitizedMessage}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== SCROLL TO TOP BUTTON =====
(function initScrollToTop() {
  // Create scroll to top button
  const scrollBtn = document.createElement('button');
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollBtn.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(scrollBtn);
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add('show');
    } else {
      scrollBtn.classList.remove('show');
    }
  });
  
  // Scroll to top on click
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
})();

// ===== ENHANCED ADD PLAYER WITH TOAST =====
const originalAddPlayer = addPlayer;
addPlayer = function(e) {
  e.preventDefault();
  const player = {
    name: document.getElementById('player-name').value.trim(),
    runs: parseInt(document.getElementById('runs').value) || 0,
    balls: parseInt(document.getElementById('balls').value) || 0,
    fours: parseInt(document.getElementById('fours').value) || 0,
    sixes: parseInt(document.getElementById('sixes').value) || 0,
    matchType: document.getElementById('match-type').value,
    team: document.getElementById('team').value.trim()
  };
  
  // Validate player data
  const validationError = validatePlayerData(player);
  if (validationError) {
    showError(validationError);
    showToast(validationError, 'error');
    return;
  }
  
  players.push(player);
  savePlayers();
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  e.target.reset();
  
  showToast(`Player "${player.name}" added successfully!`, 'success');
};

// ===== ENHANCED DELETE WITH TOAST =====
const originalDeletePlayer = deletePlayer;
deletePlayer = async function(index) {
  const player = players[index];
  const confirmed = await customConfirm(
    `Are you sure you want to delete ${player.name}?`,
    'Delete Player',
    '🗑️'
  );
  
  if (confirmed) {
    players.splice(index, 1);
    savePlayers();
    updateStats();
    updateTable();
    updateCharts();
    populateComparisonSelects();
    populatePlayerOfMatchSelect();
    showToast(`Player "${player.name}" deleted successfully`, 'success');
  }
};

// ===== ENHANCED EDIT WITH TOAST =====
const originalSaveEdit = saveEdit;
saveEdit = function(e) {
  e.preventDefault();
  const index = parseInt(document.getElementById('edit-index').value);
  const player = {
    name: document.getElementById('edit-name').value.trim(),
    runs: parseInt(document.getElementById('edit-runs').value) || 0,
    balls: parseInt(document.getElementById('edit-balls').value) || 0,
    fours: parseInt(document.getElementById('edit-fours').value) || 0,
    sixes: parseInt(document.getElementById('edit-sixes').value) || 0,
    matchType: document.getElementById('edit-match-type').value,
    team: document.getElementById('edit-team').value.trim()
  };
  
  // Validate player data
  const validationError = validatePlayerData(player);
  if (validationError) {
    showError(validationError);
    showToast(validationError, 'error');
    return;
  }
  
  players[index] = player;
  savePlayers();
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  populatePlayerOfMatchSelect();
  closeModal();
  
  showToast(`Player "${player.name}" updated successfully!`, 'success');
};

// ===== ENHANCED CLEAR ALL WITH TOAST =====
const originalClearAll = clearAll;
clearAll = async function() {
  if (players.length === 0) {
    showToast('No players to clear', 'warning');
    return;
  }
  
  const confirmed = await customConfirm(
    `Are you sure you want to delete all ${players.length} players? This action cannot be undone.`,
    'Clear All Players',
    '⚠️'
  );
  
  if (confirmed) {
    const count = players.length;
    players = [];
    savePlayers();
    updateStats();
    updateTable();
    updateCharts();
    populateComparisonSelects();
    populatePlayerOfMatchSelect();
    showToast(`All ${count} players cleared successfully`, 'success');
  }
};

// ===== ENHANCED CSV IMPORT WITH TOAST =====
const originalImportCSV = importCSV;
importCSV = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  showToast('Importing CSV file...', 'info', 2000);
  
  // Call original function and add toast on completion
  setTimeout(() => {
    originalImportCSV(e);
    showToast('CSV imported successfully!', 'success');
  }, 500);
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K: Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
      // Switch to statistics tab
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.querySelector('#statistics').style.display = 'block';
      document.querySelectorAll('.tabs a').forEach(a => a.classList.remove('active'));
      document.querySelector('.tabs a[href="#statistics"]').classList.add('active');
      searchBox.focus();
      showToast('Search activated - Type to find players', 'info', 2000);
    }
  }
  
  // Ctrl/Cmd + N: Focus add player form
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelector('#add-player').style.display = 'block';
    document.querySelectorAll('.tabs a').forEach(a => a.classList.remove('active'));
    document.querySelector('.tabs a[href="#add-player"]').classList.add('active');
    document.getElementById('player-name').focus();
    showToast('Add new player', 'info', 2000);
  }
  
  // Ctrl/Cmd + /: Show keyboard shortcuts
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    showKeyboardShortcuts();
  }
  
  // Escape: Close modals
  if (e.key === 'Escape') {
    const modal = document.getElementById('edit-modal');
    if (modal.classList.contains('show')) {
      closeModal();
    }
  }
});

// ===== KEYBOARD SHORTCUTS HELP =====
function showKeyboardShortcuts() {
  const shortcuts = `
    <strong>Keyboard Shortcuts:</strong><br><br>
    <strong>Ctrl/Cmd + K</strong> - Search players<br>
    <strong>Ctrl/Cmd + N</strong> - Add new player<br>
    <strong>Ctrl/Cmd + /</strong> - Show this help<br>
    <strong>Esc</strong> - Close dialogs<br>
  `;
  
  const dialog = document.getElementById('error-dialog');
  const titleEl = document.querySelector('.error-title');
  const messageEl = document.getElementById('error-message');
  const iconEl = document.querySelector('.error-icon');
  
  titleEl.textContent = 'Keyboard Shortcuts';
  messageEl.innerHTML = shortcuts;
  iconEl.textContent = '⌨️';
  dialog.classList.add('show');
}

// ===== ENHANCED DOWNLOAD CSV WITH TOAST =====
const originalDownloadCSV = downloadCSV;
downloadCSV = function() {
  if (players.length === 0) {
    showToast('No players to export', 'warning');
    return;
  }
  
  originalDownloadCSV();
  showToast(`Exported ${players.length} players to CSV`, 'success');
};

// ===== PAGE LOAD ANIMATION =====
window.addEventListener('load', () => {
  showToast('Welcome to Cricket Performance Analyzer! Press Ctrl+/ for shortcuts', 'info', 4000);
});

// ===== FOOTER LINK HANDLERS =====
document.querySelectorAll('.footer-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const targetTab = href;
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.querySelector(targetTab).style.display = 'block';
      document.querySelectorAll('.tabs a').forEach(a => a.classList.remove('active'));
      document.querySelector(`.tabs a[href="${targetTab}"]`).classList.add('active');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// ===== IMPROVED FORM VALIDATION =====
function addInputValidation() {
  const numberInputs = document.querySelectorAll('input[type="number"]');
  
  numberInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const min = parseInt(this.getAttribute('min')) || 0;
      const value = parseInt(this.value);
      
      if (this.value === '') return;
      
      if (value < min) {
        this.value = min;
        showToast(`Value cannot be less than ${min}`, 'warning', 2000);
      }
    });
    
    // Prevent negative values on input
    input.addEventListener('input', function() {
      if (this.value && parseInt(this.value) < 0) {
        this.value = 0;
      }
    });
  });
}

// Initialize input validation
addInputValidation();

// ===== ANALYTICS TAB ENHANCEMENTS =====
document.querySelector('.tabs a[href="#analytics"]').addEventListener('click', () => {
  if (players.length === 0) {
    showToast('Add some players first to see analytics', 'info', 3000);
  } else {
    showToast('Loading analytics...', 'info', 1500);
  }
});

// BUG #4 FIX: Duplicate function removed - now defined earlier in file
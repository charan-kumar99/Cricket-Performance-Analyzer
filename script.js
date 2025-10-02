// Global variables
let players = [];
let runsChart = null;
let strikeChart = null;
let boundaryChart = null;
let comparisonChart = null;
let isDarkTheme = true;
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
  
  // Initialize theme
  const savedTheme = localStorage.getItem('cricketTheme');
  if (savedTheme === 'light') {
    toggleTheme();
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Update UI
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  populateTeamFilter();

  // Show initial tab
  document.querySelector('#dashboard').style.display = 'block';
});

// Set up event listeners
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
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
    });
  });
}

// Toggle between dark and light theme
function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  document.body.classList.toggle('light-theme', !isDarkTheme);
  document.querySelector('.theme-toggle .fa-moon').style.display = isDarkTheme ? 'block' : 'none';
  document.querySelector('.theme-toggle .fa-sun').style.display = isDarkTheme ? 'none' : 'block';
  
  // Save theme preference
  localStorage.setItem('cricketTheme', isDarkTheme ? 'dark' : 'light');
  
  // Update charts to match theme
  updateCharts();
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

// Get chart options based on theme
function getChartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: isDarkTheme ? '#e0e0e0' : '#1a1f3a'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: isDarkTheme ? '#e0e0e0' : '#1a1f3a'
        }
      },
      x: {
        ticks: {
          color: isDarkTheme ? '#e0e0e0' : '#1a1f3a'
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
  
  // Runs Chart
  const runsCtx = document.getElementById('runsChart').getContext('2d');
  runsChart = new Chart(runsCtx, {
    type: 'bar',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [{
        label: 'Runs',
        data: topPlayers.map(p => p.runs),
        backgroundColor: 'rgba(0, 217, 255, 0.6)',
        borderColor: 'rgba(0, 217, 255, 1)',
        borderWidth: 2
      }]
    },
    options: getChartOptions()
  });
  
  // Strike Rate Chart
  const strikeCtx = document.getElementById('strikeChart').getContext('2d');
  strikeChart = new Chart(strikeCtx, {
    type: 'line',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [{
        label: 'Strike Rate',
        data: topPlayers.map(p => {
          const sr = calculateStrikeRate(p.runs, p.balls);
          return sr === '∞' ? 300 : parseFloat(sr); // Use 300 as proxy for infinity
        }),
        backgroundColor: 'rgba(255, 0, 110, 0.2)',
        borderColor: 'rgba(255, 0, 110, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      ...getChartOptions(),
      scales: {
        y: {
          ticks: {
            color: isDarkTheme ? '#e0e0e0' : '#1a1f3a',
            callback: function(value, index, values) {
              if (value >= 300) return '∞';
              return value;
            }
          }
        },
        x: {
          ticks: {
            color: isDarkTheme ? '#e0e0e0' : '#1a1f3a'
          }
        }
      }
    }
  });
  
  // Boundary Chart
  const boundaryCtx = document.getElementById('boundaryChart').getContext('2d');
  boundaryChart = new Chart(boundaryCtx, {
    type: 'bar',
    data: {
      labels: topPlayers.map(p => p.name),
      datasets: [
        {
          label: 'Fours',
          data: topPlayers.map(p => p.fours || 0),
          backgroundColor: 'rgba(0, 217, 255, 0.6)',
          borderColor: 'rgba(0, 217, 255, 1)',
          borderWidth: 1
        },
        {
          label: 'Sixes',
          data: topPlayers.map(p => p.sixes || 0),
          backgroundColor: 'rgba(255, 0, 110, 0.6)',
          borderColor: 'rgba(255, 0, 110, 1)',
          borderWidth: 1
        }
      ]
    },
    options: getChartOptions()
  });
}

// Add player
function addPlayer(e) {
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
    return;
  }
  
  players.push(player);
  savePlayers();
  updateStats();
  updateTable();
  updateCharts();
  populateComparisonSelects();
  e.target.reset();
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

// Download CSV
function downloadCSV() {
  let csv = 'Name,Runs,Balls,Fours,Sixes,Strike Rate,Match Type,Team\n';
  players.forEach(p => {
    // Escape commas and quotes in name/team
    const escapedName = p.name.includes(',') || p.name.includes('"') ? `"${p.name.replace(/"/g, '""')}"` : p.name;
    const escapedTeam = (p.team || '').includes(',') || (p.team || '').includes('"') ? `"${(p.team || '').replace(/"/g, '""')}"` : (p.team || '');
    
    csv += `${escapedName},${p.runs},${p.balls},${p.fours || 0},${p.sixes || 0},${calculateStrikeRate(p.runs, p.balls)},${p.matchType || 'T20'},${escapedTeam}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cricket_stats.csv';
  a.click();
  URL.revokeObjectURL(url);
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
          backgroundColor: 'rgba(0, 217, 255, 0.6)',
          borderColor: 'rgba(0, 217, 255, 1)',
          borderWidth: 1
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
          backgroundColor: 'rgba(255, 0, 110, 0.6)',
          borderColor: 'rgba(255, 0, 110, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      ...getChartOptions(),
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkTheme ? '#e0e0e0' : '#1a1f3a',
            callback: function(value, index, values) {
              if (value >= 300) return '∞';
              return value;
            }
          }
        },
        x: {
          ticks: {
            color: isDarkTheme ? '#e0e0e0' : '#1a1f3a'
          }
        }
      }
    }
  });
}

// Save players to localStorage
function savePlayers() {
  try {
    localStorage.setItem('cricketPlayers', JSON.stringify(players));
  } catch (e) {
    // Handle localStorage quota exceeded
    showError('Storage limit exceeded. Some data may not be saved.');
  }
}
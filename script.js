let players = [];
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

// --- Utility Functions ---
function calculateStrikeRate(runs, balls) {
  return balls === 0 ? 'N/A' : ((runs / balls) * 100).toFixed(2);
}

function showMessage(msg, isError = false) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = msg;
  messageElement.classList.remove('error', 'show'); // Reset classes
  if (isError) {
    messageElement.classList.add('error');
  }
  messageElement.classList.add('show');
  setTimeout(() => {
    messageElement.classList.remove('show');
  }, 3000);
}

function savePlayers() {
  localStorage.setItem('cricketPlayers', JSON.stringify(players));
}

function loadPlayers() {
  const storedPlayers = localStorage.getItem('cricketPlayers');
  if (storedPlayers) {
    players = JSON.parse(storedPlayers);
    updateTable(document.getElementById('search-box').value);
  }
}

// --- Table Management ---
function updateTable(filter = '') {
  const tbody = document.getElementById('scorecard-body');
  tbody.innerHTML = '';
  let total = 0;

  let filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Apply sorting
  if (currentSortColumn) {
    filteredPlayers.sort((a, b) => {
      let valA, valB;
      if (currentSortColumn === 'strikeRate') {
        valA = parseFloat(calculateStrikeRate(a.runs, a.balls));
        valB = parseFloat(calculateStrikeRate(b.runs, b.balls));
        if (isNaN(valA)) valA = -Infinity;
        if (isNaN(valB)) valB = -Infinity;
      } else {
        valA = a[currentSortColumn];
        valB = b[currentSortColumn];
      }

      if (typeof valA === 'string') {
        return currentSortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return currentSortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });
  }

  if (filteredPlayers.length === 0 && filter === '') {
    tbody.innerHTML =
      '<tr><td colspan="7">No player data available. Add a player or import from CSV.</td></tr>';
  } else if (filteredPlayers.length === 0 && filter !== '') {
    tbody.innerHTML = `<tr><td colspan="7">No players found matching "${filter}".</td></tr>`;
  } else {
    filteredPlayers.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.runs}</td>
        <td>${p.fours ?? '-'}</td>
        <td>${p.sixes ?? '-'}</td>
        <td>${p.balls}</td>
        <td>${calculateStrikeRate(p.runs, p.balls)}</td>
        <td>
          <button class="edit-button" data-index="${players.indexOf(p)}">Edit</button>
          <button class="delete-button" data-index="${players.indexOf(p)}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
      total += p.runs;
    });
  }

  document.getElementById('total').textContent = `Total Runs: ${total}`;
  addActionButtonListeners();
}

function addActionButtonListeners() {
  document.querySelectorAll('.edit-button').forEach(button => {
    button.onclick = e => editPlayer(parseInt(e.target.dataset.index));
  });
  document.querySelectorAll('.delete-button').forEach(button => {
    button.onclick = e => deletePlayer(parseInt(e.target.dataset.index));
  });
}

// --- Form and Player Actions ---
document.getElementById('player-form').addEventListener('submit', e => {
  e.preventDefault();
  const nameInput = document.getElementById('player-name');
  const runsInput = document.getElementById('runs');
  const foursInput = document.getElementById('fours');
  const sixesInput = document.getElementById('sixes');
  const ballsInput = document.getElementById('balls');

  const name = nameInput.value.trim();
  const runs = parseInt(runsInput.value);
  const fours = parseInt(foursInput.value) || 0;
  const sixes = parseInt(sixesInput.value) || 0;
  const balls = parseInt(ballsInput.value);

  // Basic validation
  if (!name || /\d/.test(name)) {
    showMessage('Player name cannot be empty or contain numbers.', true);
    nameInput.focus();
    return;
  }
  if (isNaN(runs) || runs < 0) {
    showMessage('Runs must be a non-negative number.', true);
    runsInput.focus();
    return;
  }
  if (isNaN(balls) || balls < 0) {
    showMessage('Balls must be a non-negative number.', true);
    ballsInput.focus();
    return;
  }
  if (isNaN(fours) || fours < 0) {
    showMessage('Fours must be a non-negative number.', true);
    foursInput.focus();
    return;
  }
  if (isNaN(sixes) || sixes < 0) {
    showMessage('Sixes must be a non-negative number.', true);
    sixesInput.focus();
    return;
  }

  // Strict consistency check
  const boundaryRuns = fours * 4 + sixes * 6;
  const totalBoundaries = fours + sixes;

  const maxPossibleRuns = balls * 6;
  const remainingRuns = runs - boundaryRuns;
  const remainingBalls = balls - totalBoundaries;
  const maxRunsFromRemainingBalls = remainingBalls * 6;

  if (boundaryRuns > runs) {
    showMessage('Boundary runs (fours + sixes) cannot exceed total runs.', true);
    return;
  }
  if (runs > maxPossibleRuns) {
    showMessage(
      'Total runs cannot exceed maximum possible runs (6 per ball).',
      true
    );
    return;
  }
  if (totalBoundaries > balls) {
    showMessage('Total boundaries cannot exceed total balls faced.', true);
    return;
  }
  if (remainingRuns > maxRunsFromRemainingBalls) {
    showMessage(
      'Impossible run data for the given balls and boundaries.',
      true
    );
    return;
  }
  if (runs > 0 && balls === 0) {
    showMessage('If runs are scored, balls faced cannot be zero.', true);
    return;
  }

  players.unshift({ name, runs, fours, sixes, balls });
  savePlayers();
  updateTable(document.getElementById('search-box').value);
  showMessage('Player added successfully!');
  e.target.reset();
});

function editPlayer(index) {
  const player = players[index];
  document.getElementById('player-name').value = player.name;
  document.getElementById('runs').value = player.runs;
  document.getElementById('fours').value = player.fours;
  document.getElementById('sixes').value = player.sixes;
  document.getElementById('balls').value = player.balls;
  players.splice(index, 1);
  savePlayers();
  updateTable(document.getElementById('search-box').value);
  showMessage('Player data loaded for editing. Please re-add to save changes.');
  document.getElementById('player-name').focus();
}

function deletePlayer(index) {
  if (confirm(`Are you sure you want to delete ${players[index].name}'s data?`)) {
    players.splice(index, 1);
    savePlayers();
    updateTable(document.getElementById('search-box').value);
    showMessage('Player deleted successfully.');
  }
}

function clearAll() {
  if (confirm('Are you sure you want to clear ALL player data? This action cannot be undone.')) {
    players = [];
    savePlayers();
    updateTable();
    showMessage('All data cleared.');
  }
}

function downloadCSV() {
  if (players.length === 0) {
    showMessage('No data to download.', true);
    return;
  }
  const rows = [['Name', 'Runs', 'Fours', 'Sixes', 'Balls']].concat(
    players.map(p => [p.name, p.runs, p.fours, p.sixes, p.balls])
  );
  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cricket_players_data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showMessage('CSV downloaded successfully.');
}

// --- CSV Import ---
document.getElementById('csv-input').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    const lines = event.target.result.trim().split('\n');
    let importedCount = 0;
    lines.forEach(line => {
      const parts = line.split(',').map(v => v.trim());
      if (parts.length < 5) return;

      const name = parts[0];
      const runs = parseInt(parts[1]);
      const fours = parseInt(parts[2]) || 0;
      const sixes = parseInt(parts[3]) || 0;
      const balls = parseInt(parts[4]);

      if (!name || /\d/.test(name) || isNaN(runs) || runs < 0 || isNaN(balls) || balls < 0 || isNaN(fours) || fours < 0 || isNaN(sixes) || sixes < 0) {
        console.warn(`Skipping invalid CSV row: ${line}`);
        return;
      }

      // Strict consistency check for CSV
      const boundaryRuns = fours * 4 + sixes * 6;
      const totalBoundaries = fours + sixes;
      const maxPossibleRuns = balls * 6;
      const remainingRuns = runs - boundaryRuns;
      const remainingBalls = balls - totalBoundaries;
      const maxRunsFromRemainingBalls = remainingBalls * 6;

      if (boundaryRuns > runs || runs > maxPossibleRuns || totalBoundaries > balls || remainingRuns > maxRunsFromRemainingBalls) {
        console.warn(`Skipping impossible run data: ${line}`);
        return;
      }

      const isDuplicate = players.some(p => p.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) return;

      players.unshift({ name, runs, fours, sixes, balls });
      importedCount++;
    });
    savePlayers();
    updateTable(document.getElementById('search-box').value);
    showMessage(`CSV Imported! Added ${importedCount} new players.`);
  };
  reader.readAsText(file);
});

// --- Search & Sort ---
document.getElementById('search-box').addEventListener('input', () => {
  updateTable(document.getElementById('search-box').value);
});

document.querySelectorAll('.btn-sort').forEach(button => {
  button.addEventListener('click', (e) => {
    const column = e.target.dataset.sort;
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }
    updateTable(document.getElementById('search-box').value);
  });
});

// --- AI Assistant ---
document.getElementById('ai-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const aiResponseElement = document.getElementById('ai-response');
    aiResponseElement.textContent = '';

    if (players.length === 0) {
      aiResponseElement.textContent = 'No player data available to analyze.';
      return;
    }

    const query = e.target.value.toLowerCase().trim();
    let response = '';

    if (query.includes("best strike rate")) {
      let best = players.reduce((a, b) => {
        const srA = parseFloat(calculateStrikeRate(a.runs, a.balls));
        const srB = parseFloat(calculateStrikeRate(b.runs, b.balls));
        return (srB > srA) ? b : a;
      }, players[0]);
      response = `Best Strike Rate: ${best.name} (${calculateStrikeRate(best.runs, best.balls)})`;
    } else if (query.includes("worst strike rate")) {
      let worst = players.reduce((a, b) => {
        const srA = parseFloat(calculateStrikeRate(a.runs, a.balls));
        const srB = parseFloat(calculateStrikeRate(b.runs, b.balls));
        return (srB < srA) ? b : a;
      }, players[0]);
      response = `Worst Strike Rate: ${worst.name} (${calculateStrikeRate(worst.runs, worst.balls)})`;
    } else if (query.includes("total runs")) {
      const total = players.reduce((sum, p) => sum + p.runs, 0);
      response = `Total Runs across all players: ${total}`;
    } else if (query.includes("most runs")) {
      let top = players.reduce((a, b) => a.runs > b.runs ? a : b, players[0]);
      response = `Most Runs: ${top.name} (${top.runs} runs)`;
    } else if (query.includes("least runs")) {
      let least = players.reduce((a, b) => a.runs < b.runs ? a : b, players[0]);
      response = `Least Runs: ${least.name} (${least.runs} runs)`;
    } else if (query.includes("most fours")) {
      let topFours = players.reduce((a, b) => (a.fours || 0) > (b.fours || 0) ? a : b, players[0]);
      response = `Most Fours: ${topFours.name} (${topFours.fours || 0} fours)`;
    } else if (query.includes("most sixes")) {
      let topSixes = players.reduce((a, b) => (a.sixes || 0) > (b.sixes || 0) ? a : b, players[0]);
      response = `Most Sixes: ${topSixes.name} (${topSixes.sixes || 0} sixes)`;
    } else if (query.includes("average runs")) {
      const totalRuns = players.reduce((sum, p) => sum + p.runs, 0);
      const averageRuns = players.length > 0 ? (totalRuns / players.length).toFixed(2) : 0;
      response = `Average Runs per player: ${averageRuns}`;
    } else {
      const match = query.match(/show\s+(.*?)\s+stats/i) || query.match(/stats\s+for\s+(.*)/i) || query.match(/stats\s+of\s+(.*)/i);
      if (match) {
        const name = match[1].trim().toLowerCase();
        const player = players.find(p => p.name.toLowerCase() === name);
        if (player) {
          response = `${player.name}'s Stats — Runs: ${player.runs}, Fours: ${player.fours ?? '-'}, Sixes: ${player.sixes ?? '-'}, Balls: ${player.balls}, Strike Rate: ${calculateStrikeRate(player.runs, player.balls)}`;
        } else {
          response = `Player "${match[1]}" not found.`;
        }
      } else {
        response = "Sorry, I don't understand that question. Try 'Show [Player Name] stats', 'Who has the best strike rate', 'Total runs', etc.";
      }
    }
    aiResponseElement.textContent = response;
    e.target.value = '';
  }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
  loadPlayers();
  updateTable(); // Initial table render
});

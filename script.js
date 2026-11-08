const COLORS = ['Yellow', 'Orange', 'Red', 'Green', 'Blue'];
const PERIODS = 6;
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;
const STORAGE_KEY = 'elev8-roster-state';

// App state: the full ordered roster, who is here, and the selected rotation shift.
const state = {
    players: [], // [{ name, present }]
    shift: 0
};

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parsePlayerInput(input) {
    // Split by newlines and commas, filter out empty strings
    return input
        .split(/[\n,]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

function presentPlayers() {
    return state.players.filter(p => p.present).map(p => p.name);
}

// ---------- Persistence ----------

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // Storage can be unavailable (e.g. private browsing); the app still works without it.
    }
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.players)) {
            state.players = saved.players
                .filter(p => p && typeof p.name === 'string')
                .map(p => ({ name: p.name, present: p.present !== false }));
            state.shift = Number.isInteger(saved.shift) ? saved.shift : 0;
        }
    } catch (e) {
        // Ignore corrupt or unavailable storage
    }
}

// ---------- Views ----------

function showView(view) {
    document.getElementById('rosterView').hidden = view !== 'roster';
    document.getElementById('scheduleView').hidden = view !== 'schedule';
    window.scrollTo(0, 0);
}

function showEditor(show) {
    document.getElementById('listEditor').hidden = !show;
    document.getElementById('attendance').hidden = show;
    document.getElementById('editorMessage').hidden = true;
    // Cancel only makes sense if there is a list to go back to
    document.getElementById('cancelEditButton').hidden = state.players.length === 0;
    if (show) {
        document.getElementById('playerInput').value = state.players.map(p => p.name).join('\n');
    }
}

function renderAttendance() {
    const list = document.getElementById('playerList');
    list.innerHTML = state.players.map((p, i) => `
        <li>
            <button class="player-row ${p.present ? '' : 'absent'}" data-index="${i}" aria-pressed="${!p.present}">
                <span class="player-rank">${i + 1}</span>
                <span class="player-name">${escapeHtml(p.name)}</span>
                <span class="player-status">${p.present ? '✓ Here' : 'Absent'}</span>
            </button>
        </li>`).join('');

    const count = presentPlayers().length;
    document.getElementById('presentCount').textContent = `${count} of ${state.players.length} here`;

    const ok = count >= MIN_PLAYERS && count <= MAX_PLAYERS;
    const button = document.getElementById('generateButton');
    const message = document.getElementById('generateMessage');
    button.disabled = !ok;
    message.hidden = ok;
    if (!ok) {
        message.textContent = count < MIN_PLAYERS
            ? `Need at least ${MIN_PLAYERS} players here (currently ${count}).`
            : `At most ${MAX_PLAYERS} players are supported (currently ${count}).`;
    }
}

function loadList() {
    const names = parsePlayerInput(document.getElementById('playerInput').value);
    if (names.length === 0) {
        const message = document.getElementById('editorMessage');
        message.textContent = 'Please enter at least one player.';
        message.hidden = false;
        return;
    }

    // Keep absent marks for names that were already on the list
    const previouslyAbsent = new Set(state.players.filter(p => !p.present).map(p => p.name));
    state.players = names.map(name => ({ name, present: !previouslyAbsent.has(name) }));
    state.shift = 0;
    saveState();

    showEditor(false);
    renderAttendance();
}

function togglePlayer(index) {
    const player = state.players[index];
    if (!player) return;
    player.present = !player.present;
    state.shift = 0; // attendance changed, so start again from the primary rotation
    saveState();
    renderAttendance();
}

function generateRoster() {
    const players = presentPlayers();
    try {
        const roster = createRotation(players, state.shift);
        displayRoster(roster, players);
        showView('schedule');
    } catch (error) {
        const message = document.getElementById('generateMessage');
        message.textContent = error.message;
        message.hidden = false;
    }
}

function changeShift(value) {
    state.shift = parseInt(value, 10) || 0;
    saveState();
    const players = presentPlayers();
    displayRoster(createRotation(players, state.shift), players);
}

function init() {
    loadState();

    document.getElementById('loadListButton').addEventListener('click', loadList);
    document.getElementById('cancelEditButton').addEventListener('click', () => showEditor(false));
    document.getElementById('editListButton').addEventListener('click', () => showEditor(true));
    document.getElementById('generateButton').addEventListener('click', generateRoster);
    document.getElementById('backButton').addEventListener('click', () => showView('roster'));
    document.getElementById('playerList').addEventListener('click', e => {
        const row = e.target.closest('.player-row');
        if (row) togglePlayer(parseInt(row.dataset.index, 10));
    });

    showView('roster');
    showEditor(state.players.length === 0);
    renderAttendance();
}

// Only wire up the UI on the main page (test.html loads this file without it)
if (typeof document !== 'undefined' && document.getElementById('rosterView')) {
    document.addEventListener('DOMContentLoaded', init);
}

function createRotation(players, shift = 0) {
    const numPlayers = players.length;
    const shiftAmount = ((shift % numPlayers) + numPlayers) % numPlayers;

    // Primary rotations: balance skill distribution
    const rotations = {
        5: [
            [0, 1, 2, 3, 4], // Period 1: 1,2,3,4,5
            [0, 1, 2, 3, 4], // Period 2: 1,2,3,4,5
            [0, 1, 2, 3, 4], // Period 3: 1,2,3,4,5
            [0, 1, 2, 3, 4], // Period 4: 1,2,3,4,5
            [0, 1, 2, 3, 4], // Period 5: 1,2,3,4,5
            [0, 1, 2, 3, 4]  // Period 6: 1,2,3,4,5
        ],
        6: [
            [0, 1, 2, 4, 5], // Period 1: 1,2,3,5,6 (odds 1,3,5 + evens 2,6)
            [0, 1, 2, 3, 5], // Period 2: 1,2,3,4,6 (evens 2,4,6 + odds 1,3)
            [0, 1, 2, 3, 4], // Period 3: 1,2,3,4,5 (odds 1,3,5 + evens 2,4)
            [0, 1, 3, 4, 5], // Period 4: 1,2,4,5,6 (evens 2,4,6 + odds 1,5)
            [0, 2, 3, 4, 5], // Period 5: 1,3,4,5,6 (odds 1,3,5 + evens 4,6)
            [1, 2, 3, 4, 5]  // Period 6: 2,3,4,5,6 (evens 2,4,6 + odds 3,5)
        ],
        7: [
            [0, 1, 2, 4, 6], // Period 1: 1,2,3,5,7 (odds 1,3,5,7 + even 2)
            [0, 1, 2, 3, 5], // Period 2: 1,2,3,4,6 (evens 2,4,6 + odds 1,3)
            [0, 2, 3, 4, 6], // Period 3: 1,3,4,5,7 (odds 1,3,5,7 + even 4)
            [1, 2, 3, 4, 5], // Period 4: 2,3,4,5,6 (evens 2,4,6 + odds 3,5)
            [0, 2, 4, 5, 6], // Period 5: 1,3,5,6,7 (odds 1,3,5,7 + even 6)
            [0, 1, 3, 5, 6], // Period 6: 1,2,4,6,7 (evens 2,4,6 + odds 1,7)
        ],
        8: [
            [0, 1, 2, 4, 6], // Period 1: 1,2,3,5,7 (odds 1,3,5,7 + even 2)
            [0, 1, 3, 5, 7], // Period 2: 1,2,4,6,8 (evens 2,4,6,8 + odd 1)
            [0, 2, 3, 4, 6], // Period 3: 1,3,4,5,7 (odds 1,3,5,7 + even 4)
            [1, 2, 3, 5, 7], // Period 4: 2,3,4,6,8 (evens 2,4,6,8 + odd 3)
            [0, 2, 4, 5, 6], // Period 5: 1,3,5,6,7 (odds 1,3,5,7 + even 6)
            [1, 3, 4, 5, 7]  // Period 6: 2,4,5,6,8 (evens 2,4,6,8 + odd 5)
        ],
        9: [
            [0, 2, 4, 6, 8], // Period 1: 1,3,5,7,9 (all odds)
            [0, 1, 3, 5, 7], // Period 2: 1,2,4,6,8 (evens 2,4,6,8 + odd 1)
            [0, 2, 4, 6, 8], // Period 3: 1,3,5,7,9 (all odds)
            [1, 2, 3, 5, 7], // Period 4: 2,3,4,6,8 (evens 2,4,6,8 + odd 3)
            [0, 2, 4, 6, 8], // Period 5: 1,3,5,7,9 (all odds)
            [1, 3, 4, 5, 7]  // Period 6: 2,4,5,6,8 (evens 2,4,6,8 + odd 5)
        ],
        10: [
            [0, 2, 4, 6, 8], // Period 1: 1,3,5,7,9 (all odds)
            [1, 3, 5, 7, 9], // Period 2: 2,4,6,8,10 (all evens)
            [0, 2, 4, 6, 8], // Period 3: 1,3,5,7,9 (all odds)
            [1, 3, 5, 7, 9], // Period 4: 2,4,6,8,10 (all evens)
            [0, 2, 4, 6, 8], // Period 5: 1,3,5,7,9 (all odds)
            [1, 3, 5, 7, 9]  // Period 6: 2,4,6,8,10 (all evens)
        ]
    };

    // Check if we support this number of players
    if (!rotations[numPlayers]) {
        throw new Error(`Only 5-10 players are supported. You entered ${numPlayers} players.`);
    }

    const primaryRotation = rotations[numPlayers];

    // Generate rotation by shifting player indices by shiftAmount
    if (shiftAmount === 0) {
        return primaryRotation;
    }

    return primaryRotation.map(period =>
        period.map(playerIdx => (playerIdx + shiftAmount) % numPlayers).sort((a, b) => a - b)
    );
}

function displayRoster(roster, players) {
    const numPlayers = players.length;
    const currentShift = state.shift;

    let html = '<h2>Roster Schedule</h2>';

    // Add rotation selector dropdown
    html += '<div class="rotation-toggle">';
    html += '<label class="toggle-label">';
    html += '<span style="margin-right: 10px;">Rotation:</span>';
    html += '<select id="rotationShift" onchange="changeShift(this.value)">';
    for (let i = 0; i < numPlayers; i++) {
        const selected = i == currentShift ? 'selected' : '';
        const label = i === 0 ? `${i} (Primary)` : `${i}`;
        html += `<option value="${i}" ${selected}>${label}</option>`;
    }
    html += '</select>';
    html += '</label>';
    html += '</div>';

    // Add action buttons
    html += '<div class="action-buttons">';
    html += '<button class="copy-button" onclick="copyRosterToClipboard(this)">📋 Copy Table</button>';
    html += '<button class="fullscreen-button" onclick="openFullscreen()">🖼️ Fullscreen</button>';
    html += '</div>';

    // Create summary
    const playCount = Array(players.length).fill(0);
    roster.forEach(period => {
        period.forEach(playerIdx => {
            if (playerIdx !== -1) playCount[playerIdx]++;
        });
    });

    html += '<div class="summary">';
    html += '<h3>Player Summary</h3>';
    html += '<table class="summary-table"><tr><th>Player</th><th>Periods Playing</th></tr>';
    players.forEach((player, idx) => {
        html += `<tr><td>${escapeHtml(player)}</td><td>${playCount[idx]}</td></tr>`;
    });
    html += '</table></div>';

    // Create main roster table
    html += '<table class="roster-table" id="rosterTable">';

    // Header row
    html += '<tr><th>Color</th>';
    for (let period = 1; period <= PERIODS; period++) {
        html += `<th>${period}</th>`;
    }
    html += '</tr>';

    // Color rows
    COLORS.forEach((color, colorIdx) => {
        html += `<tr><td class="color-cell ${color.toLowerCase()}">${color}</td>`;

        for (let period = 0; period < PERIODS; period++) {
            const playerIdx = roster[period][colorIdx];
            const playerName = playerIdx !== -1 ? players[playerIdx] : '-';
            html += `<td class="player-cell">${escapeHtml(playerName)}</td>`;
        }

        html += '</tr>';
    });

    html += '</table>';

    // Add validation info
    html += checkConstraints(roster, players);

    document.getElementById('output').innerHTML = html;

    // Store roster data for copying
    window.currentRoster = { roster, players };
}

function copyRosterToClipboard(button) {
    if (!window.currentRoster) {
        alert('No roster to copy!');
        return;
    }

    const { roster, players } = window.currentRoster;

    // Create tab-separated text format for easy pasting into spreadsheets
    let text = 'Color';
    for (let period = 1; period <= PERIODS; period++) {
        text += `\t${period}`;
    }
    text += '\n';

    // Add each color row
    COLORS.forEach((color, colorIdx) => {
        text += color;
        for (let period = 0; period < PERIODS; period++) {
            const playerIdx = roster[period][colorIdx];
            const playerName = playerIdx !== -1 ? players[playerIdx] : '-';
            text += `\t${playerName}`;
        }
        text += '\n';
    });

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const originalText = button.innerHTML;
        button.innerHTML = '✓ Copied!';
        button.classList.add('copied');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        alert('Failed to copy to clipboard. Please try again.');
        console.error('Copy failed:', err);
    });
}

function openFullscreen() {
    const table = document.getElementById('rosterTable');
    if (!table) return;

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'fullscreenOverlay';
    overlay.className = 'fullscreen-overlay';

    // Clone the table
    const tableClone = table.cloneNode(true);
    tableClone.id = 'fullscreenTable';

    // Create container
    const container = document.createElement('div');
    container.className = 'fullscreen-container';

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Elev8 Basketball Roster';
    title.className = 'fullscreen-title';

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fullscreen-close';
    closeBtn.innerHTML = '✕ Close';
    closeBtn.onclick = closeFullscreen;

    // Assemble
    container.appendChild(title);
    container.appendChild(tableClone);
    container.appendChild(closeBtn);
    overlay.appendChild(container);

    document.body.appendChild(overlay);

    // Add ESC key listener
    document.addEventListener('keydown', handleEscKey);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    const overlay = document.getElementById('fullscreenOverlay');
    if (overlay) {
        overlay.remove();
    }

    // Remove ESC key listener
    document.removeEventListener('keydown', handleEscKey);

    // Restore body scroll
    document.body.style.overflow = '';
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
}

function checkConstraints(roster, players) {
    let html = '<div class="validation">';
    let allGood = true;

    // Check that each period has exactly 5 players
    roster.forEach((period, periodIdx) => {
        const playersThisPeriod = period.filter(p => p !== -1).length;
        if (playersThisPeriod !== COLORS.length) {
            html += `<p class="warning">⚠️ Period ${periodIdx + 1} has ${playersThisPeriod} players (should be ${COLORS.length})</p>`;
            allGood = false;
        }
    });

    // Check play count distribution
    const playCount = Array(players.length).fill(0);
    roster.forEach(period => {
        period.forEach(playerIdx => {
            if (playerIdx !== -1) playCount[playerIdx]++;
        });
    });

    const minPlays = Math.min(...playCount);
    const maxPlays = Math.max(...playCount);
    if (maxPlays - minPlays > 1) {
        html += `<p class="warning">⚠️ Play count imbalance: some players play ${maxPlays} periods, others play ${minPlays}</p>`;
        allGood = false;
    }

    // Check if anyone sits out 2+ periods in a row
    const playerPeriods = Array(players.length).fill(null).map(() => []);
    roster.forEach((period, periodIdx) => {
        period.forEach(playerIdx => {
            if (playerIdx !== -1) {
                playerPeriods[playerIdx].push(periodIdx);
            }
        });
    });

    players.forEach((player, playerIdx) => {
        const periods = playerPeriods[playerIdx];
        for (let i = 0; i < periods.length - 1; i++) {
            if (periods[i + 1] - periods[i] > 2) {
                html += `<p class="warning">⚠️ ${escapeHtml(player)} sits out periods ${periods[i] + 2} through ${periods[i + 1]}</p>`;
                allGood = false;
            }
        }
    });

    if (allGood) {
        html += '<p class="success">✓ All constraints satisfied!</p>';
        html += `<p class="success">✓ Each period has exactly ${COLORS.length} players</p>`;
        html += `<p class="success">✓ No player sits out 2+ consecutive periods</p>`;
        html += `<p class="success">✓ Fair play distribution (difference ≤ 1 period)</p>`;
    }

    html += '</div>';
    return html;
}

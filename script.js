const COLORS = ['Yellow', 'Orange', 'Red', 'Green', 'Blue'];
const PERIODS = 6;

function parsePlayerInput(input) {
    // Split by newlines and commas, filter out empty strings
    return input
        .split(/[\n,]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

function generateRoster() {
    const input = document.getElementById('playerInput').value;
    const players = parsePlayerInput(input);

    if (players.length === 0) {
        document.getElementById('output').innerHTML = '<p class="error">Please enter at least one player.</p>';
        return;
    }

    const roster = createRotation(players);
    displayRoster(roster, players);
}

function createRotation(players) {
    const numPlayers = players.length;
    const totalSlots = COLORS.length * PERIODS;
    const playsPerPlayer = Math.floor(totalSlots / numPlayers);
    const extraSlots = totalSlots % numPlayers;

    // Track how many times each player should play
    const targetPlays = players.map((_, i) =>
        i < extraSlots ? playsPerPlayer + 1 : playsPerPlayer
    );

    // Track actual plays and last played period for each player
    const playerStats = players.map(() => ({
        playsCount: 0,
        lastPlayedPeriod: -2 // Initialize to -2 so they can play period 0
    }));

    // Create roster: roster[period][colorIndex] = playerIndex
    const roster = Array(PERIODS).fill(null).map(() => Array(COLORS.length).fill(-1));

    // For each period, assign players to colors
    for (let period = 0; period < PERIODS; period++) {
        // Categorize players into priority groups
        const mustPlay = []; // Players who sat out last period (to avoid sitting 2 in a row)
        const canPlay = []; // Players who played last period but can play again
        const done = []; // Players who've reached their target

        for (let playerIdx = 0; playerIdx < numPlayers; playerIdx++) {
            const stats = playerStats[playerIdx];

            // Skip if player has reached their target plays
            if (stats.playsCount >= targetPlays[playerIdx]) {
                done.push(playerIdx);
                continue;
            }

            // Must play if they sat out the previous period (to avoid 2 consecutive sit-outs)
            if (stats.lastPlayedPeriod < period - 1) {
                mustPlay.push(playerIdx);
            } else {
                canPlay.push(playerIdx);
            }
        }

        // Sort each group by priority
        const sortByPriority = (a, b) => {
            const statsA = playerStats[a];
            const statsB = playerStats[b];

            // By play count (ascending - fewer plays = higher priority)
            if (statsA.playsCount !== statsB.playsCount) {
                return statsA.playsCount - statsB.playsCount;
            }

            // By skill (lower index = more skilled = higher priority)
            return a - b;
        };

        mustPlay.sort(sortByPriority);
        canPlay.sort(sortByPriority);

        // Combine: mustPlay first, then canPlay
        const selectedPlayers = [...mustPlay, ...canPlay].slice(0, COLORS.length);

        // If we still don't have 5 players, add from done players (shouldn't happen with valid input)
        if (selectedPlayers.length < COLORS.length) {
            done.sort(sortByPriority);
            selectedPlayers.push(...done.slice(0, COLORS.length - selectedPlayers.length));
        }

        // Assign selected players to this period's colors
        for (let colorIdx = 0; colorIdx < selectedPlayers.length; colorIdx++) {
            const playerIdx = selectedPlayers[colorIdx];
            roster[period][colorIdx] = playerIdx;
            playerStats[playerIdx].playsCount++;
            playerStats[playerIdx].lastPlayedPeriod = period;
        }
    }

    return roster;
}

function displayRoster(roster, players) {
    let html = '<h2>Roster Schedule</h2>';

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
        html += `<tr><td>${player}</td><td>${playCount[idx]}</td></tr>`;
    });
    html += '</table></div>';

    // Create main roster table
    html += '<table class="roster-table">';

    // Header row
    html += '<tr><th>Color</th>';
    for (let period = 1; period <= PERIODS; period++) {
        html += `<th>Period ${period}</th>`;
    }
    html += '</tr>';

    // Color rows
    COLORS.forEach((color, colorIdx) => {
        html += `<tr><td class="color-cell ${color.toLowerCase()}">${color}</td>`;

        for (let period = 0; period < PERIODS; period++) {
            const playerIdx = roster[period][colorIdx];
            const playerName = playerIdx !== -1 ? players[playerIdx] : '-';
            html += `<td class="player-cell">${playerName}</td>`;
        }

        html += '</tr>';
    });

    html += '</table>';

    // Add validation info
    html += checkConstraints(roster, players);

    document.getElementById('output').innerHTML = html;
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
                html += `<p class="warning">⚠️ ${player} sits out periods ${periods[i] + 2} through ${periods[i + 1]}</p>`;
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

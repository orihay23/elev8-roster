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

    // Divide players into odd and even position groups for skill distribution
    // Odd positions: 1st, 3rd, 5th, 7th, 9th (indices 0, 2, 4, 6, 8)
    // Even positions: 2nd, 4th, 6th, 8th, 10th (indices 1, 3, 5, 7, 9)
    const oddGroup = [];
    const evenGroup = [];
    for (let i = 0; i < numPlayers; i++) {
        if (i % 2 === 0) {
            oddGroup.push(i);
        } else {
            evenGroup.push(i);
        }
    }

    // Track how many times each player should play
    const targetPlays = players.map((_, i) =>
        i < extraSlots ? playsPerPlayer + 1 : playsPerPlayer
    );

    // Track actual plays and last played period for each player
    const playerStats = players.map(() => ({
        playsCount: 0,
        lastPlayedPeriod: -2
    }));

    // Create roster: roster[period][colorIndex] = playerIndex
    const roster = Array(PERIODS).fill(null).map(() => Array(COLORS.length).fill(-1));

    // Alternate between odd and even groups for each period
    for (let period = 0; period < PERIODS; period++) {
        // Start with the appropriate group based on period
        const primaryGroup = period % 2 === 0 ? oddGroup : evenGroup;
        const secondaryGroup = period % 2 === 0 ? evenGroup : oddGroup;

        const selectedPlayers = [];

        // Helper function to get available players from a group
        const getAvailableFromGroup = (group) => {
            return group.filter(playerIdx => {
                const stats = playerStats[playerIdx];
                // Can play if haven't reached target
                return stats.playsCount < targetPlays[playerIdx];
            }).sort((a, b) => {
                const statsA = playerStats[a];
                const statsB = playerStats[b];

                // Prioritize those who sat out last period
                if (statsA.lastPlayedPeriod < period - 1 && statsB.lastPlayedPeriod >= period - 1) return -1;
                if (statsB.lastPlayedPeriod < period - 1 && statsA.lastPlayedPeriod >= period - 1) return 1;

                // Then by play count (fewer plays = higher priority)
                if (statsA.playsCount !== statsB.playsCount) {
                    return statsA.playsCount - statsB.playsCount;
                }

                // Then by original order (skill level)
                return a - b;
            });
        };

        // First, get players from primary group
        const availablePrimary = getAvailableFromGroup(primaryGroup);
        selectedPlayers.push(...availablePrimary.slice(0, COLORS.length));

        // If we need more players, get from secondary group
        if (selectedPlayers.length < COLORS.length) {
            const availableSecondary = getAvailableFromGroup(secondaryGroup);
            selectedPlayers.push(...availableSecondary.slice(0, COLORS.length - selectedPlayers.length));
        }

        // If still not enough (edge case), get anyone who can play
        if (selectedPlayers.length < COLORS.length) {
            const allAvailable = [];
            for (let i = 0; i < numPlayers; i++) {
                if (!selectedPlayers.includes(i)) {
                    allAvailable.push(i);
                }
            }
            selectedPlayers.push(...allAvailable.slice(0, COLORS.length - selectedPlayers.length));
        }

        // Sort selected players by their original order (skill level) before assigning
        selectedPlayers.sort((a, b) => a - b);

        // Assign selected players to this period's colors
        for (let colorIdx = 0; colorIdx < selectedPlayers.length && colorIdx < COLORS.length; colorIdx++) {
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

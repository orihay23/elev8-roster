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

    try {
        const roster = createRotation(players);
        displayRoster(roster, players);
    } catch (error) {
        document.getElementById('output').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function createRotation(players) {
    const numPlayers = players.length;
    const useAlternate = document.getElementById('useAlternate')?.checked || false;

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

    // Alternate rotations: give weaker players (higher numbers) more playing time
    const alternateRotations = {
        5: [
            [0, 1, 2, 3, 4], // Same as primary (all play equally)
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4]
        ],
        6: [
            [0, 1, 2, 3, 4], // Period 1: 1,2,3,4,5 (all play equally - different pattern)
            [1, 2, 3, 4, 5], // Period 2: 2,3,4,5,6
            [0, 1, 2, 4, 5], // Period 3: 1,2,3,5,6
            [0, 2, 3, 4, 5], // Period 4: 1,3,4,5,6
            [0, 1, 3, 4, 5], // Period 5: 1,2,4,5,6
            [0, 1, 2, 3, 5]  // Period 6: 1,2,3,4,6
        ],
        7: [
            [0, 1, 2, 3, 4], // Period 1: 1,2,3,4,5
            [1, 2, 3, 5, 6], // Period 2: 2,3,4,6,7 (players 6,7 get more time)
            [0, 2, 4, 5, 6], // Period 3: 1,3,5,6,7
            [0, 1, 3, 5, 6], // Period 4: 1,2,4,6,7
            [1, 2, 4, 5, 6], // Period 5: 2,3,5,6,7
            [0, 1, 3, 4, 5]  // Period 6: 1,2,4,5,6
        ],
        8: [
            [0, 1, 2, 3, 4], // Period 1: 1,2,3,4,5
            [2, 3, 5, 6, 7], // Period 2: 3,4,6,7,8 (players 1,2 get less time)
            [0, 2, 4, 5, 6], // Period 3: 1,3,5,6,7
            [1, 3, 4, 5, 7], // Period 4: 2,4,5,6,8
            [2, 4, 5, 6, 7], // Period 5: 3,5,6,7,8
            [0, 3, 4, 6, 7]  // Period 6: 1,4,5,7,8
        ],
        9: [
            [0, 2, 4, 6, 8], // Period 1: 1,3,5,7,9 (all odds)
            [1, 3, 4, 5, 7], // Period 2: 2,4,5,6,8 (players 5,7,9 get more time)
            [0, 2, 4, 6, 8], // Period 3: 1,3,5,7,9
            [1, 3, 5, 6, 7], // Period 4: 2,4,6,7,8
            [0, 2, 4, 6, 8], // Period 5: 1,3,5,7,9
            [1, 3, 5, 7, 8]  // Period 6: 2,4,6,8,9
        ],
        10: [
            [1, 3, 5, 7, 9], // Period 1: 2,4,6,8,10 (start with evens)
            [0, 2, 4, 6, 8], // Period 2: 1,3,5,7,9
            [1, 3, 5, 7, 9], // Period 3: 2,4,6,8,10
            [0, 2, 4, 6, 8], // Period 4: 1,3,5,7,9
            [1, 3, 5, 7, 9], // Period 5: 2,4,6,8,10
            [0, 2, 4, 6, 8]  // Period 6: 1,3,5,7,9
        ]
    };

    const selectedRotations = useAlternate ? alternateRotations : rotations;

    // Check if we support this number of players
    if (!selectedRotations[numPlayers]) {
        throw new Error(`Only 5-10 players are supported. You entered ${numPlayers} players.`);
    }

    // Return the hardcoded rotation
    return selectedRotations[numPlayers];
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

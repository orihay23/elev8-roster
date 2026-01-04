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

    // Hardcoded rotations for supported player counts
    // Each rotation is an array of 6 periods, each period has 5 player indices
    const rotations = {
        5: [
            [0, 1, 2, 3, 4], // Period 1: all 5 play
            [0, 1, 2, 3, 4], // Period 2: all 5 play
            [0, 1, 2, 3, 4], // Period 3: all 5 play
            [0, 1, 2, 3, 4], // Period 4: all 5 play
            [0, 1, 2, 3, 4], // Period 5: all 5 play
            [0, 1, 2, 3, 4]  // Period 6: all 5 play
        ],
        6: [
            [0, 2, 4, 5, 1], // Period 1: 1,3,5,6,2 (alternating + extras)
            [1, 3, 5, 0, 2], // Period 2: 2,4,6,1,3
            [0, 2, 4, 1, 3], // Period 3: 1,3,5,2,4
            [1, 3, 5, 2, 4], // Period 4: 2,4,6,3,5
            [0, 2, 4, 3, 5], // Period 5: 1,3,5,4,6
            [1, 3, 5, 0, 4]  // Period 6: 2,4,6,1,5
        ],
        7: [
            [0, 2, 4, 6, 1], // Period 1: 1,3,5,7,2
            [1, 3, 5, 0, 2], // Period 2: 2,4,6,1,3
            [0, 2, 4, 6, 3], // Period 3: 1,3,5,7,4
            [1, 3, 5, 2, 4], // Period 4: 2,4,6,3,5
            [0, 2, 4, 6, 5], // Period 5: 1,3,5,7,6
            [1, 3, 5, 0, 6]  // Period 6: 2,4,6,1,7
        ],
        8: [
            [0, 2, 4, 6, 1], // Period 1: 1,3,5,7,2
            [1, 3, 5, 7, 0], // Period 2: 2,4,6,8,1
            [0, 2, 4, 6, 3], // Period 3: 1,3,5,7,4
            [1, 3, 5, 7, 2], // Period 4: 2,4,6,8,3
            [0, 2, 4, 6, 5], // Period 5: 1,3,5,7,6
            [1, 3, 5, 7, 4]  // Period 6: 2,4,6,8,5
        ],
        9: [
            [0, 2, 4, 6, 8], // Period 1: 1,3,5,7,9
            [1, 3, 5, 7, 0], // Period 2: 2,4,6,8,1
            [0, 2, 4, 6, 8], // Period 3: 1,3,5,7,9
            [1, 3, 5, 7, 2], // Period 4: 2,4,6,8,3
            [0, 2, 4, 6, 8], // Period 5: 1,3,5,7,9
            [1, 3, 5, 7, 4]  // Period 6: 2,4,6,8,5
        ],
        10: [
            [0, 2, 4, 6, 8], // Period 1: 1,3,5,7,9
            [1, 3, 5, 7, 9], // Period 2: 2,4,6,8,10
            [0, 2, 4, 6, 8], // Period 3: 1,3,5,7,9
            [1, 3, 5, 7, 9], // Period 4: 2,4,6,8,10
            [0, 2, 4, 6, 8], // Period 5: 1,3,5,7,9
            [1, 3, 5, 7, 9]  // Period 6: 2,4,6,8,10
        ]
    };

    // Check if we support this number of players
    if (!rotations[numPlayers]) {
        throw new Error(`Only 5-10 players are supported. You entered ${numPlayers} players.`);
    }

    // Return the hardcoded rotation
    return rotations[numPlayers];
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

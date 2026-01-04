# Elev8 Basketball Roster Generator

A simple web application for generating fair basketball roster rotations for youth leagues.

## Features

- Input players in order from most to least skilled (comma or line-separated)
- Automatically generates a rotation schedule across 6 periods and 5 color teams
- Ensures fair play time distribution
- Prevents players from sitting out 2+ consecutive periods
- Visual color-coded table display
- Player summary showing total periods played

## How to Use

1. Open `index.html` in your web browser
2. Enter your player names in the text area, either:
   - Comma-separated: `Player1, Player2, Player3`
   - Line-separated (one per line)
3. Click "Generate Roster"
4. View the generated schedule showing which player plays on which color team for each period

## Game Structure

- **Periods**: 6 periods per game
- **Colors**: 5 teams (Yellow, Orange, Red, Green, Blue)
- **Total Slots**: 30 (5 colors × 6 periods)

## Algorithm Rules

1. **Fair Distribution**: All players play approximately the same number of periods
   - With 30 total slots and N players, each player plays ⌊30/N⌋ or ⌈30/N⌉ periods
   - No player plays more than 1 period more than any other player

2. **No Consecutive Sitting**: No player sits out 2 or more periods in a row
   - If a player plays in period N, they may sit in period N+1, but must play by period N+2

3. **Skill Distribution**: More skilled players (listed first) are prioritized when multiple players are eligible

## Example

For 8 players, each will play either 3 or 4 periods:
- 6 players × 4 periods = 24 slots
- 2 players × 3 periods = 6 slots
- Total: 30 slots

## Files

- `index.html` - Main application interface
- `script.js` - Rotation algorithm and display logic
- `styles.css` - Styling and layout
- `test.html` - Algorithm testing page

## Deployment

This app is configured for automatic deployment to GitHub Pages.

### Quick Deploy

1. **Merge to main branch**: Merge this branch to `main` (via PR or directly)
2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Under "Source", select "GitHub Actions"
   - Save
3. **Access your app**: `https://orihay23.github.io/elev8-roster/`

The included GitHub Actions workflow will automatically deploy whenever you push to the main branch.

### Alternative: Deploy from current branch

You can also configure GitHub Pages to deploy directly from this branch:
- Go to Settings → Pages
- Select this branch as the source
- Select `/` (root) as the folder
- Save

## Testing

Open `test.html` in a browser to see test cases with different numbers of players and verify the algorithm constraints are met.

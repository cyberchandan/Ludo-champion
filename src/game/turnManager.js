/**
 * Ludo Champion - Turn Manager
 */

/**
 * Finds the next active player index, skipping finished players
 * @param {number} currentIndex 
 * @param {Array<Object>} players 
 * @param {Array<string>} [rankings=[]] 
 * @returns {number} Next player index
 */
export function getNextPlayerIndex(currentIndex, players, rankings = []) {
  if (!players || players.length === 0) return 0;

  const total = players.length;
  let nextIndex = (currentIndex + 1) % total;
  let attempts = 0;

  while (attempts < total) {
    const candidatePlayer = players[nextIndex];
    if (candidatePlayer && !candidatePlayer.hasFinished && !rankings.includes(candidatePlayer.id)) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % total;
    attempts++;
  }

  return currentIndex;
}

/**
 * Determines whether the current player gets an extra roll or the turn should switch
 * @param {Object} options
 * @param {number} options.diceValue
 * @param {boolean} options.hasCaptured
 * @param {boolean} options.hasReachedHome
 * @param {boolean} options.threeSixesExceeded
 * @returns {boolean} True if player earns a bonus roll, false if turn switches
 */
export function shouldGrantExtraTurn({ diceValue, hasCaptured = false, hasReachedHome = false, threeSixesExceeded = false }) {
  if (threeSixesExceeded) {
    return false; // Penalty: forfeit turn immediately
  }

  // Bonus rolls earned for:
  // 1. Rolling a 6
  // 2. Capturing an opponent
  // 3. Reaching home destination
  return diceValue === 6 || hasCaptured || hasReachedHome;
}

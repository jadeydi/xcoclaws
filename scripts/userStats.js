/**
 * Display followers and following count next to the user name
 */

const userStatsMap = new Map();

export function handleStatsData(message) {
  if (message && message.users && Array.isArray(message.users)) {
    message.users.forEach(user => {
      if (user.screen_name) {
        userStatsMap.set(user.screen_name.toLowerCase(), {
          followers: user.followers_count,
          following: user.friends_count
        });
      }
    });
    // After getting data, trigger a UI update
    updateAllUserCells();
  }
}

function formatCount(num) {
  if (num === undefined || num === null) return '0';
  const count = Number(num);
  if (isNaN(count)) return '0';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

export function updateAllUserCells() {
  const userCells = document.querySelectorAll('[data-testid="UserCell"]');
  userCells.forEach(cell => {
    // Extract screen name (handle)
    const handleEl = cell.querySelector('a[href^="/"] [dir="ltr"]');
    let screenName = '';
    
    // Check all spans for handle pattern
    const spans = cell.querySelectorAll('span');
    for (const span of spans) {
      const text = span.innerText;
      if (text.startsWith('@') && text.length > 1) {
        screenName = text.substring(1).toLowerCase();
        break;
      }
    }

    if (!screenName) return;
    
    const stats = userStatsMap.get(screenName);
    if (stats) {
      injectStats(cell, stats);
    }
  });
}

function injectStats(cell, stats) {
  // Find the name container - specifically the display name part
  const nameContainer = cell.querySelector('[data-testid="User-Name"]');
  if (!nameContainer) return;

  // We want to find the first link's inner container (Display Name)
  const displayNameLink = nameContainer.querySelector('a');
  if (!displayNameLink) return;

  const target = displayNameLink.querySelector('[dir="ltr"]');
  if (!target) return;

  // Check if already injected
  const existing = target.querySelector('.xcoclaws-stats');
  const statsHTML = `<span class="xcoclaws-stat-item">Followers: <b>${formatCount(stats.followers)}</b></span><span class="xcoclaws-stat-divider">·</span><span class="xcoclaws-stat-item">Following: <b>${formatCount(stats.following)}</b></span>`;

  
  if (existing) {
    if (existing.innerHTML !== statsHTML) {
      existing.innerHTML = statsHTML;
    }
    return;
  }

  const statsEl = document.createElement('span');
  statsEl.className = 'xcoclaws-stats';
  statsEl.innerHTML = statsHTML;
  
  // Append after the name (which is usually a span or direct text)
  target.appendChild(statsEl);
}


export function initUserStats() {
  console.log('XCoClaws: User Stats initialization');
  // Listen for messages from the injected script
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'X_STATS_DATA') {
      console.log('XCoClaws: Received Stats Data', event.data.data);
      handleStatsData(event.data.data);
    }
  });


  // Observe DOM for new user cells
  const observer = new MutationObserver(() => {
    updateAllUserCells();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial update
  updateAllUserCells();
}

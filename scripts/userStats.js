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
          following: user.friends_count,
          is_following: user.is_following,
          is_followed_by: user.is_followed_by
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
  // Target both UserCell (lists) and User-Name (tweet headers/profiles)
  const containers = document.querySelectorAll('[data-testid="UserCell"], [data-testid="User-Name"]');

  containers.forEach(container => {
    // Extract screen name (handle)
    let screenName = '';

    // Check all links or spans for handle pattern (@handle)
    const spans = container.querySelectorAll('span');
    for (const span of spans) {
      const text = span.innerText;
      if (text.startsWith('@') && text.length > 1) {
        screenName = text.substring(1).toLowerCase();
        break;
      }
    }

    if (!screenName) {
      // Try to get from link href as fallback
      const link = container.querySelector('a[href^="/"]');
      if (link) {
        const parts = link.getAttribute('href').split('/');
        if (parts.length > 1) {
          const name = parts[1].toLowerCase();
          // Exclude known non-user paths
          if (!['home', 'explore', 'notifications', 'messages', 'search', 'settings', 'i'].includes(name)) {
            screenName = name;
          }
        }
      }
    }

    if (!screenName) return;

    const stats = userStatsMap.get(screenName);
    if (stats) {
      injectStats(container, stats);
    }
  });
}

function injectStats(container, stats) {
  // Find the target container where we want to append the stats
  let target = null;

  // Find User-Name container (might be the container itself or nested)
  const nameContainer = container.getAttribute('data-testid') === 'User-Name'
    ? container
    : container.querySelector('[data-testid="User-Name"]');

  if (nameContainer) {
    // For timeline tweets, User-Name is often a flex row containing Name and Handle
    // We want to append to this row so it appears after the handle/time.
    if (nameContainer.classList.contains('r-18u37iz')) {
      target = nameContainer;
    } else {
      // Fallback: look for the first flex row inside (usually contains the name)
      target = nameContainer.querySelector('div.r-18u37iz') || nameContainer.querySelector('[dir="ltr"]');
    }
  }

  // Method 2: Fallback to the user's specific structure (inside a link)
  if (!target) {
    const nameLink = container.querySelector('a[role="link"] div.r-18u37iz');
    if (nameLink) {
      target = nameLink;
    }
  }

  if (!target) return;

  // Check if already injected
  let statsEl = target.querySelector('.xcoclaws-stats');
  const statsHTML = `
    <span class="xcoclaws-stat-item">Fing: <b>${formatCount(stats.following)}</b>&nbsp;${stats.is_following ? '👍' : ''}</span>
    <span class="xcoclaws-stat-divider">·</span>
    <span class="xcoclaws-stat-item">Fol: <b>${formatCount(stats.followers)}</b>&nbsp;${stats.is_followed_by ? '🫡' : ''}</span>
  `;

  if (statsEl) {
    if (statsEl.getAttribute('data-stats') !== JSON.stringify(stats)) {
      statsEl.innerHTML = statsHTML;
      statsEl.setAttribute('data-stats', JSON.stringify(stats));
    }
    return;
  }

  statsEl = document.createElement('span');
  statsEl.className = 'xcoclaws-stats';
  statsEl.setAttribute('data-stats', JSON.stringify(stats));
  statsEl.innerHTML = statsHTML;

  // Append to target
  target.appendChild(statsEl);
}


export function initUserStats() {
  // Listen for messages from the injected script
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'X_STATS_DATA') {
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

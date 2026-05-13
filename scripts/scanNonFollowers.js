import { debug } from './logger';

let isScanning = false;
let lastResults = null;

/**
 * 获取当前扫描状态
 */
export function getScanStatus() {
  return { isScanning, lastResults };
}

/**
 * 扫描单向关注用户（我关注了，但没关注我的）
 */
export async function scanNonFollowers(limit = 5) {
  if (isScanning) {
    return { error: '扫描正在进行中...' };
  }

  if (!window.location.pathname.endsWith('/following')) {
    return { error: '请先前往“正在关注”页面（Following page）' };
  }

  isScanning = true;
  const results = [];
  const processedUsernames = new Set();

  try {
    // 滚动并收集
    let lastScrollHeight = 0;
    let noNewCount = 0;
    const maxNoNewAttempts = 5;

    while (results.length < limit) {
      const userCells = document.querySelectorAll('[data-testid="UserCell"]');

      userCells.forEach(cell => {
        if (results.length >= limit) return;

        const cellText = cell.innerText;
        const followTexts = ['Follows you', '关注了你'];
        const followsYou = followTexts.some(text => cellText.includes(text));

        const followingTexts = ['Following', '正在关注'];
        const isFollowing = followingTexts.some(text => cellText.includes(text));

        if (!followsYou && isFollowing) {
          // 提取信息
          const handleMatch = cellText.match(/@[\w_]+/);
          const handle = handleMatch ? handleMatch[0] : null;

          if (handle && !processedUsernames.has(handle)) {
            const nameEl = cell.querySelector('div[dir="ltr"] span');
            const name = nameEl ? nameEl.innerText : handle;

            const imgEl = cell.querySelector('img');
            const avatar = imgEl ? imgEl.src : null;

            const linkEl = cell.querySelector('a');
            const profileUrl = linkEl ? linkEl.href : `https://x.com/${handle.slice(1)}`;

            debug(`🚀 ~ User ${results.length + 1}:`, name, handle, avatar, profileUrl);
            results.push({
              name,
              handle,
              avatar,
              profileUrl
            });
            processedUsernames.add(handle);
          }
        }
      });

      if (results.length >= limit) break;

      // 滚动页面
      window.scrollBy(0, 1000);
      await new Promise(r => setTimeout(r, 1500)); // 等待加载

      const currentScrollHeight = document.documentElement.scrollHeight;
      if (currentScrollHeight === lastScrollHeight) {
        noNewCount++;
        if (noNewCount >= maxNoNewAttempts) break; // 到底了
      } else {
        lastScrollHeight = currentScrollHeight;
        noNewCount = 0;
      }
    }

    lastResults = results;
    return { users: results };
  } catch (err) {
    console.error('Scan failed:', err);
    return { error: '扫描过程中出错: ' + err.message };
  } finally {
    isScanning = false;
  }
}

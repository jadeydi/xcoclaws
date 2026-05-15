import { initMarkNonFollowers, setHighlightEnabled } from './markNonFollowers';
import { initUserStats, setStatsEnabled } from './userStats';
import { scanNonFollowers, getScanStatus } from './scanNonFollowers';
import { unfollowUsers } from './unfollow.js';
import { setDebug, debug } from './logger';

// 注入 API 拦截器
const injectScript = (debugEnabled) => {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    // 将调试状态传递给注入的脚本
    if (debugEnabled) {
      script.dataset.debug = 'true';
    }
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('[XCoClaws] Failed to inject script', e);
  }
};

// 初始化逻辑
const init = async () => {
  // 从存储中获取设置
  const settings = await chrome.storage.sync.get(['debugMode', 'highlightNonMutual', 'showUserStats']);

  // 优先级：localStorage (手动) > chrome.storage (设置页)
  const localOverride = localStorage.getItem('XCOCLAWS_DEBUG') === 'true';
  const debugEnabled = localOverride || settings.debugMode === true;

  setDebug(debugEnabled);
  setHighlightEnabled(settings.highlightNonMutual !== false); // 默认为 true
  setStatsEnabled(settings.showUserStats !== false); // 默认为 true

  // 监听存储变化，实时更新设置
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.debugMode) {
        setDebug(changes.debugMode.newValue);
      }
      if (changes.highlightNonMutual) {
        setHighlightEnabled(changes.highlightNonMutual.newValue);
      }
      if (changes.showUserStats) {
        setStatsEnabled(changes.showUserStats.newValue);
      }
    }
  });

  injectScript(debugEnabled);

  debug('Content Script Loaded');

  // 初始化功能
  initMarkNonFollowers();
  initUserStats();
};

init();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const pageTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || 'No description';

    debug('Extracting page data...');

    sendResponse({
      title: pageTitle,
      description: metaDescription,
      url: window.location.href
    });
  } else if (request.action === 'scanNonFollowers') {
    debug('Scanning non-followers...');
    // TODO replace 20
    scanNonFollowers(20).then(result => {
      sendResponse(result);
    }).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'getScanStatus') {
    sendResponse(getScanStatus());
  } else if (request.action === 'unfollowUsers') {
    debug('Received unfollow request:', request.handles);
    unfollowUsers(request.handles).then(result => {
      sendResponse(result);
    }).catch(err => {
      sendResponse({ error: err.message });
    });
    return true;
  }
});

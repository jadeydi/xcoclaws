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

// 注入 API 拦截器 (立即执行以捕获最早的请求)
const localOverride = typeof localStorage !== 'undefined' && localStorage.getItem('XCOCLAWS_DEBUG') === 'true';
injectScript(localOverride);

// 初始化逻辑
const init = async () => {
  // 从存储中获取设置
  const settings = await chrome.storage.sync.get(['debugMode', 'highlightNonMutual', 'showUserStats']);

  const debugEnabled = localOverride || settings.debugMode === true;
  if (debugEnabled && !localOverride) {
    // 如果 storage 中开启了调试但 localOverride 没开，我们需要重新注入或者更新状态
    // 不过 injectScript 已经运行了，再次调用会 handle 重复逻辑
    injectScript(true);
  }

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

  debug('Content Script Loaded');

  // 等待 body 就绪后初始化 DOM 相关功能
  if (document.body) {
    initMarkNonFollowers();
    initUserStats();
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      if (document.body) {
        initMarkNonFollowers();
        initUserStats();
        obs.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true });
  }
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
    debug('Scanning non-followers with limit:', request.limit);
    scanNonFollowers(request.limit || 20).then(result => {
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

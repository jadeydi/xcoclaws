import { initMarkNonFollowers } from './markNonFollowers';
import { initUserStats } from './userStats';
import { scanNonFollowers, getScanStatus } from './scanNonFollowers';
import { unfollowUsers } from './unfollow.js';
import { setDebug, debug, log } from './logger';



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
  const settings = await chrome.storage.sync.get(['debugMode']);

  // 优先级：localStorage (手动) > chrome.storage (设置页)
  const localOverride = localStorage.getItem('XCOCLAWS_DEBUG') === 'true';
  const debugEnabled = localOverride || settings.debugMode === true;

  setDebug(debugEnabled);

  // 更新日志函数的闭包引用（如果其他模块已经引用了旧的，可能需要其他方式更新）
  // 但在这里我们直接在 init 后运行其他初始化
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

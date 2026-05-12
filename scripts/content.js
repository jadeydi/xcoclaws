import { initMarkNonFollowers } from './markNonFollowers';
import { initUserStats } from './userStats';

// 注入 API 拦截器
const injectScript = () => {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('XCoClaws: Failed to inject script', e);
  }
};

injectScript();

console.log('XCoClaws Content Script Loaded');

// 初始化标记没有关注你的用户功能
initMarkNonFollowers();
// 初始化展示用户数据功能
initUserStats();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const pageTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || 'No description';

    console.log('Extracting page data...');

    sendResponse({
      title: pageTitle,
      description: metaDescription,
      url: window.location.href
    });
  }
});

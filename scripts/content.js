import { initMarkNonFollowers } from './markNonFollowers';

// Content Script - 运行在网页上下文中

console.log('XcoClaws Content Script Loaded');

// 初始化标记没有关注你的用户功能
initMarkNonFollowers();

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

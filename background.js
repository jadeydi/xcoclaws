// Background Service Worker (MV3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('XcoClaws Extension Installed');
  
  // 初始化默认设置
  chrome.storage.sync.set({ 
    settings: {
      theme: 'dark',
      autoExtract: false
    }
  });
});

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  if (request.action === 'getData') {
    // 处理逻辑...
    sendResponse({ status: 'success', data: 'Some data from background' });
  }
  
  return true; // 保持通道开启以支持异步响应
});

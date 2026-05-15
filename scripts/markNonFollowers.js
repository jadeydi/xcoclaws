let isHighlightEnabled = true;

/**
 * 标记没有关注你的用户
 */
export function markNonFollowers() {
  if (!isHighlightEnabled) {
    return;
  }

  // 只在 following 页面运行
  if (!window.location.pathname.endsWith('/following')) {
    return;
  }

  const userCells = document.querySelectorAll('[data-testid="UserCell"]');
  const followTexts = ['Follows you', '关注了你'];

  userCells.forEach(cell => {
    // 找到最近的 cellInnerDiv 作为标记背景的容器
    const container = cell.closest('[data-testid="cellInnerDiv"]');
    if (!container) return;

    // 检查是否已经标记过，避免重复处理
    if (container.getAttribute('data-xcoclaws-checked') === 'true') {
      return;
    }

    // 检查是否包含 "Follows you" 或 "关注了你"
    const cellText = cell.innerText;
    const followsYou = followTexts.some(text => cellText.includes(text));

    if (!followsYou) {
      container.classList.add('not-following-highlight');
    } else {
      container.classList.remove('not-following-highlight');
    }

    // 标记为已检查
    container.setAttribute('data-xcoclaws-checked', 'true');
  });
}

/**
 * 清除所有高亮标记
 */
export function clearHighlights() {
  document.querySelectorAll('.not-following-highlight').forEach(el => {
    el.classList.remove('not-following-highlight');
  });
  document.querySelectorAll('[data-xcoclaws-checked]').forEach(el => {
    el.removeAttribute('data-xcoclaws-checked');
  });
}

/**
 * 设置是否启用高亮
 */
export function setHighlightEnabled(enabled) {
  isHighlightEnabled = enabled;
  if (!enabled) {
    clearHighlights();
  } else {
    markNonFollowers();
  }
}

/**
 * 初始化标记功能
 */
export function initMarkNonFollowers() {
  // 使用 MutationObserver 监听 DOM 变化（处理滚动加载）
  const observer = new MutationObserver(() => {
    markNonFollowers();
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 初始执行一次
  markNonFollowers();

  // 监听路径变化（SPA 导航）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // 路径变化时清除已检查标记，重新检查
      document.querySelectorAll('[data-xcoclaws-checked]').forEach(el => {
        el.removeAttribute('data-xcoclaws-checked');
      });
      markNonFollowers();
    }
  }).observe(document, { subtree: true, childList: true });
}

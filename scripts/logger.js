/**
 * 统一的日志工具
 */

// 初始状态尝试从 localStorage 获取
const getInitialDebugState = () => {
  try {
    return localStorage.getItem('XCOCLAWS_DEBUG') === 'true';
  } catch (e) {
    return false;
  }
};

let debugEnabled = getInitialDebugState();

/**
 * 更新调试状态
 */
export function setDebug(enabled) {
  debugEnabled = enabled;
}

/**
 * 调试日志
 */
export function debug(...args) {
  if (debugEnabled) {
    console.debug('%c[XCoClaws]', 'color: #71767b;', ...args);
  }
}

/**
 * 普通日志
 */
export function log(...args) {
  if (debugEnabled) {
    console.log('%c[XCoClaws]', 'color: #1d9bf0; font-weight: bold;', ...args);
  }
}

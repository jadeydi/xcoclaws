import { log, debug } from './logger';

/**
 * 等待一段时间
 * @param {number} ms 毫秒
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 寻找指定 handle 的用户单元格
 * @param {string} handle 用户名 (带或不带 @)
 */
const findUserCell = (handle) => {
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  const links = document.querySelectorAll(`a[href="/${cleanHandle}"]`);
  
  for (const link of links) {
    // 寻找最近的 cellInnerDiv
    const cell = link.closest('[data-testid="cellInnerDiv"]');
    if (cell) return cell;
  }
  return null;
};

/**
 * 取消关注单个用户
 * @param {string} handle 
 */
const unfollowUser = async (handle) => {
  debug(`Attempting to unfollow: ${handle}`);
  
  const cell = findUserCell(handle);
  if (!cell) {
    log(`Could not find cell for ${handle}, skipping...`);
    return false;
  }

  // 寻找 Following 按钮
  const unfollowBtn = cell.querySelector('[data-testid$="-unfollow"]');
  if (!unfollowBtn) {
    log(`Could not find unfollow button for ${handle}, maybe already unfollowed?`);
    return false;
  }

  // 滚动到该元素以确保可见（可选，但安全）
  cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  // 点击 Following 按钮
  unfollowBtn.click();
  debug('Clicked following button, waiting for confirmation dialog...');

  // 等待确认弹窗出现
  let confirmBtn = null;
  for (let i = 0; i < 10; i++) { // 最多等 5 秒
    confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
    if (confirmBtn) break;
    await sleep(500);
  }

  if (!confirmBtn) {
    log(`Confirmation dialog did not appear for ${handle}`);
    return false;
  }

  // 点击确认取消关注按钮
  confirmBtn.click();
  debug(`Clicked confirm unfollow for ${handle}`);

  // 等待弹窗消失
  await sleep(1000);
  return true;
};

/**
 * 批量取消关注
 * @param {string[]} handles 
 */
export const unfollowUsers = async (handles) => {
  log(`Starting batch unfollow for ${handles.length} users`);
  let successCount = 0;
  
  for (const handle of handles) {
    const success = await unfollowUser(handle);
    if (success) successCount++;
    // 每次操作之间间隔一段时间，防止被限流或识别为机器人
    await sleep(1500);
  }
  
  log(`Batch unfollow completed: ${successCount}/${handles.length} successful`);
  return { successCount, total: handles.length };
};

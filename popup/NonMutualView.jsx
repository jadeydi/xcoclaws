import React, { useState } from 'react';

function NonMutualView({ nonMutual, onBack, onRescan, scanning }) {
  const [selectedHandles, setSelectedHandles] = useState(new Set());

  const handleToggleUser = (handle) => {
    const newSelected = new Set(selectedHandles);
    if (newSelected.has(handle)) {
      newSelected.delete(handle);
    } else {
      newSelected.add(handle);
    }
    setSelectedHandles(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedHandles.size === nonMutual.length && nonMutual.length > 0) {
      setSelectedHandles(new Set());
    } else {
      setSelectedHandles(new Set(nonMutual.map(u => u.handle)));
    }
  };

  const handleUnfollowSelected = () => {
    if (selectedHandles.size === 0) return;
    const confirmed = window.confirm(`确定要取消关注选中的 ${selectedHandles.size} 位用户吗？`);
    if (confirmed) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'unfollowUsers',
          handles: Array.from(selectedHandles)
        }, () => {
        });
      });
    }
  };

  const allSelected = nonMutual.length > 0 && selectedHandles.size === nonMutual.length;

  return (
    <div className="container results-view">
      <header>
        <div className="header-top">
          <button onClick={onBack} className="back-btn">← 返回</button>
          <div className="header-actions">
            {selectedHandles.size > 0 ? (
              <button onClick={handleUnfollowSelected} className="action-btn danger mini unfollow-btn">
                <span className="btn-icon">🚫</span>
                取消关注 ({selectedHandles.size})
              </button>
            ) : (
              <button
                onClick={onRescan}
                className={`action-btn secondary mini ${scanning ? 'loading' : ''}`}
                disabled={scanning}
              >
                <span className="btn-icon">{scanning ? '⌛' : '🔄'}</span>
                {scanning ? '正在扫描...' : '重新扫描'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="results-container">
        {nonMutual.length > 0 && (
          <div className="selection-bar">
            <span className="selected-count">已选 {selectedHandles.size}</span>
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
              />
              <span className="checkmark"></span>
              <span className="label-text">{allSelected ? '取消全选' : '全选'}</span>
            </label>
          </div>
        )}
        {nonMutual.length === 0 ? (
          <p className="empty-msg">没有发现单向关注的用户</p>
        ) : (
          <div className="user-list">
            {nonMutual.map((user, index) => (
              <div key={user.handle || index} className="user-item-wrapper">
                <label className="checkbox-container mini">
                  <input
                    type="checkbox"
                    checked={selectedHandles.has(user.handle)}
                    onChange={() => handleToggleUser(user.handle)}
                  />
                  <span className="checkmark"></span>
                </label>
                <a href={user.profileUrl} target="_blank" rel="noreferrer" className="user-item">
                  <img src={user.avatar} alt={user.name} className="avatar" />
                  <div className="user-info">
                    <p className="name">{user.name}</p>
                    <p className="handle">{user.handle}</p>
                  </div>
                  <span className="external-icon">↗</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

export default NonMutualView;

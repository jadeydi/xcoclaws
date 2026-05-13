import React, { useState, useEffect } from 'react'
import './popup.css'
import NonMutualView from './NonMutualView'

function App() {
  const [scanning, setScanning] = useState(false);
  const [view, setView] = useState('main'); // 'main' or 'results'
  const [nonMutual, setNonMutual] = useState([]);
  const [error, setError] = useState(null);

  // 当 Popup 打开时，向 Content Script 查询当前的扫描状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 先从本地存储加载上一次的 View
        const stored = await chrome.storage.local.get(['lastView']);
        if (stored.lastView) {
          setView(stored.lastView);
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com'))) {
          chrome.tabs.sendMessage(tab.id, { action: 'getScanStatus' }, (response) => {
            if (response) {
              setScanning(response.isScanning);
              if (response.lastResults) {
                setNonMutual(response.lastResults);
                // 如果有结果且之前是在结果页，确保保持在结果页
                if (stored.lastView === 'results') {
                  setView('results');
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to query status:', err);
      }
    };

    checkStatus();
  }, []);

  // 监听 view 变化并保存
  useEffect(() => {
    chrome.storage.local.set({ lastView: view });
  }, [view]);


  const handleScanNonFollowers = async () => {
    setScanning(true);
    setError(null);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('x.com') && !tab.url.includes('twitter.com')) {
      setError('请在 Twitter/X 页面上使用此功能');
      setScanning(false);
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'scanNonFollowers' }, (response) => {
      setScanning(false);
      if (response && response.users) {
        setNonMutual(response.users);
        setView('results');
      } else if (response && response.error) {
        setError(response.error);
      } else {
        setError('扫描失败，请确保你在“正在关注”页面');
      }
    });
  }

  const handleSettings = () => {
    chrome.runtime.openOptionsPage();
  }

  if (view === 'results') {
    return (
      <NonMutualView
        nonMutual={nonMutual}
        onBack={() => setView('main')}
        onRescan={handleScanNonFollowers}
        scanning={scanning}
      />
    );
  }

  return (
    <div className="container">
      <header>
        <div className="logo">
          <span className="logo-icon">✨</span>
          <div className="logo-text">
            <h1>XCoClaws</h1>
            <span className="version">v1.0.0</span>
          </div>
        </div>
        <button onClick={handleSettings} className="icon-btn">⚙️</button>
      </header>

      <main>
        <div className="status-card">
          <div className="status-info">
            <p className="label">当前状态</p>
            <p className="value active">运行中</p>
          </div>
          <div className="pulse-ring"></div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="action-grid">
          <button
            onClick={handleScanNonFollowers}
            className={`action-btn accent ${scanning ? 'loading' : ''}`}
            disabled={scanning}
          >
            <span className="btn-icon">{scanning ? '⌛' : '👤'}</span>
            {scanning ? '正在扫描...' : '单向关注扫描'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App

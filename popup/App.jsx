import React, { useState, useEffect } from 'react'
import './popup.css'
import NonMutualView from './NonMutualView'

function App() {
  const [scanning, setScanning] = useState(false);
  const [view, setView] = useState('main'); // 'main' or 'results'
  const [nonMutual, setNonMutual] = useState([]);
  const [error, setError] = useState(null);
  const version = chrome?.runtime?.getManifest?.()?.version || '1.0.3';
  const [scanLimit, setScanLimit] = useState(20);

  // 当 Popup 打开时，向 Content Script 查询当前的扫描状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 先从本地存储加载上一次的 View 和 Limit
        const stored = await chrome.storage.local.get(['lastView', 'scanLimit']);
        if (stored.lastView) {
          setView(stored.lastView);
        }
        if (stored.scanLimit) {
          setScanLimit(stored.scanLimit);
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

  // 监听 view/limit 变化并保存
  useEffect(() => {
    chrome.storage.local.set({ lastView: view, scanLimit: scanLimit });
  }, [view, scanLimit]);


  const handleScanNonFollowers = async () => {
    setScanning(true);
    setError(null);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('x.com') && !tab.url.includes('twitter.com')) {
      setError('请在 Twitter/X 页面上使用此功能');
      setScanning(false);
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'scanNonFollowers', limit: scanLimit }, (response) => {
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
            <span className="version">v{version}</span>
          </div>
        </div>
        <button onClick={handleSettings} className="icon-btn">⚙️</button>
      </header>

      <main>


        {error && <div className="error-banner">{error}</div>}

        <div className="input-group">
          <div className="usage-tip">
            💡 请先确保你已进入 X.com 的 <b>Following</b> (正在关注) 列表页面，否则无法获取数据。
          </div>
          <label htmlFor="scanLimit">扫描人数 (最多一次 200 个)</label>
          <div className="input-wrapper">
            <input
              id="scanLimit"
              type="number"
              min="1"
              max="200"
              value={scanLimit}
              onChange={(e) => setScanLimit(parseInt(e.target.value) || 1)}
            />
            <span className="input-unit">人</span>
          </div>
        </div>

        <div className="action-grid">
          <button
            onClick={handleScanNonFollowers}
            className={`action-btn accent ${scanning ? 'loading' : ''}`}
            disabled={scanning}
          >
            <span className="btn-icon">{scanning ? '⌛' : '👤'}</span>
            {scanning ? '正在扫描...' : '开始单向关注扫描'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App

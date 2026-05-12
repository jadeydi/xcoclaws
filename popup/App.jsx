import React from 'react'
import './popup.css'

function App() {
  const handleExtract = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'extractData' }, (response) => {
      console.log('Data extracted:', response);
      if (response) {
        alert('数据提取成功！查看控制台。');
      }
    });
  }

  const handleAnalyze = () => {
    console.log('Analyzing...');
  }

  const handleSettings = () => {
    chrome.runtime.openOptionsPage();
  }

  return (
    <div className="container">
      <header>
        <div className="logo">
          <span className="logo-icon">✨</span>
          <h1>XCoClaws</h1>
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

        <div className="action-grid">
          <button onClick={handleExtract} className="action-btn primary">
            <span className="btn-icon">⚡</span>
            快速提取
          </button>
          <button onClick={handleAnalyze} className="action-btn secondary">
            <span className="btn-icon">🔍</span>
            智能分析
          </button>
        </div>
      </main>

      <footer>
        <p>Version 1.0.0</p>
      </footer>
    </div>
  )
}

export default App

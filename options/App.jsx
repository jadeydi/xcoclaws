import React, { useState, useEffect } from 'react'
import './options.css'

function App() {
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    chrome.storage.sync.get(['debugMode'], (result) => {
      if (result.debugMode !== undefined) setDebugMode(result.debugMode)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.sync.set({ debugMode }, () => {
      alert('设置已保存')
    })
  }

  return (
    <div className="card">
      <h1>扩展选项</h1>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            id="debugMode"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          /> 开启调试模式 (Console 日志)
        </label>
      </div>
      <button onClick={handleSave}>保存设置</button>
    </div>
  )
}

export default App

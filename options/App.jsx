import React, { useState, useEffect } from 'react'
import './options.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [autoExtract, setAutoExtract] = useState(false)

  useEffect(() => {
    chrome.storage.sync.get(['apiKey', 'autoExtract'], (result) => {
      if (result.apiKey) setApiKey(result.apiKey)
      if (result.autoExtract !== undefined) setAutoExtract(result.autoExtract)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.sync.set({ apiKey, autoExtract }, () => {
      alert('设置已保存')
    })
  }

  return (
    <div className="card">
      <h1>扩展选项</h1>
      <div className="setting">
        <label htmlFor="apiKey">API Key</label>
        <input
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="输入您的 API Key"
        />
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            id="autoExtract"
            checked={autoExtract}
            onChange={(e) => setAutoExtract(e.target.checked)}
          /> 自动提取数据
        </label>
      </div>
      <button onClick={handleSave}>保存设置</button>
    </div>
  )
}

export default App

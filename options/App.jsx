import React, { useState, useEffect } from 'react'
import './options.css'

function App() {
  const [debugMode, setDebugMode] = useState(false)
  const [highlightNonMutual, setHighlightNonMutual] = useState(true)
  const [showUserStats, setShowUserStats] = useState(true)

  useEffect(() => {
    chrome.storage.sync.get(['debugMode', 'highlightNonMutual', 'showUserStats'], (result) => {
      if (result.debugMode !== undefined) setDebugMode(result.debugMode)
      if (result.highlightNonMutual !== undefined) setHighlightNonMutual(result.highlightNonMutual)
      if (result.showUserStats !== undefined) setShowUserStats(result.showUserStats)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.sync.set({ debugMode, highlightNonMutual, showUserStats }, () => {
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
            id="highlightNonMutual"
            checked={highlightNonMutual}
            onChange={(e) => setHighlightNonMutual(e.target.checked)}
          /> 高亮标记未回关的用户
        </label>
        <p className="hint">在关注 (Following) 页面上自动用淡红色背景标出没有关注你的用户。</p>
      </div>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            id="showUserStats"
            checked={showUserStats}
            onChange={(e) => setShowUserStats(e.target.checked)}
          /> 在用户名后显示关注/粉丝数
        </label>
        <p className="hint">在推文、列表等地方，直接在用户 ID 后方显示其统计数据和关系（👍表示你关注了他，🫡表示他关注了你）。</p>
      </div>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            id="debugMode"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          /> 开启调试模式 (Console 日志)
        </label>
        <p className="hint">提示：开启后可在网页中按下 <b>F12</b> 或 <b>Cmd+Opt+J</b> (Mac) / <b>Ctrl+Shift+J</b> (Win) 查看日志。</p>
      </div>

      <button onClick={handleSave}>保存设置</button>
    </div>
  )
}

export default App

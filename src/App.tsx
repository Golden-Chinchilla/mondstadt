import React from "react";
import "./styles.css";

function App() {
  return (
    <div className="flex h-screen">
      {/* 左边：以后挂 three.js canvas */}
      <div className="flex-1 bg-black text-slate-100 flex items-center justify-center">
        3D Canvas 区域（占位）
      </div>

      {/* 右边：控制面板 */}
      <div className="w-80 border-l border-slate-700 bg-slate-900 text-slate-100 p-4">
        <h1 className="text-lg font-semibold mb-4">Mondstadt 控制面板</h1>
        <p className="text-sm text-slate-300">
          后面会放：视角切换菜单 / WebSocket 数据 / 链上状态 等。
        </p>
      </div>
    </div>
  );
}

export default App;

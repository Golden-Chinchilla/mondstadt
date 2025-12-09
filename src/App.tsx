import { useEffect, useRef } from "react";
import "./styles.css";
import { initScene, type SceneAPI } from "./three/initScene";

function App() {
  const sceneRef = useRef<SceneAPI | null>(null);

  useEffect(() => {
    // 初始化 three.js 场景
    sceneRef.current = initScene();

    // 卸载时清理
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* 左侧 Three.js Canvas 区域 */}
      <div id="canvas-container" className="flex-1 bg-black relative">
        <canvas id="three-canvas" className="w-full h-full block" />
      </div>

      {/* 右侧控制面板 */}
      <div className="w-80 border-l border-slate-700 bg-slate-900 text-slate-100 p-4 flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Mondstadt 控制面板</h1>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">
            视角切换（示例）
          </h2>
          <button
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm"
            onClick={() =>
              sceneRef.current?.setCameraPosition(
                { x: 3, y: 3, z: 3 },
                { x: 0, y: 0, z: 0 }
              )
            }
          >
            默认视角
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm"
            onClick={() =>
              sceneRef.current?.setCameraPosition(
                { x: 0, y: 5, z: 0 },
                { x: 0, y: 0, z: 0 }
              )
            }
          >
            俯视视角
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm"
            onClick={() =>
              sceneRef.current?.setCameraPosition(
                { x: 6, y: 2, z: 0 },
                { x: 0, y: 0, z: 0 }
              )
            }
          >
            侧面视角
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm"
            // onClick={() => sceneRef.current?.focusOnObjectByName("DemoCube")}
            onClick={() =>
              sceneRef.current?.focusOnObjectByName("Mondstadt_Windmill002")
            }
          >
            聚焦 DemoCube
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">
            旋转速度（示例）
          </h2>
          <button
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
            onClick={() => sceneRef.current?.spinFaster()}
          >
            转快一点
          </button>
          <button
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-sm"
            onClick={() => sceneRef.current?.spinSlower()}
          >
            转慢一点
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

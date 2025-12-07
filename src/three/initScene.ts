import * as THREE from "three";

export type SceneAPI = {
  setCameraPosition: (
    pos: THREE.Vector3Like,
    lookAt?: THREE.Vector3Like
  ) => void;
  spinFaster: () => void;
  spinSlower: () => void;
  dispose: () => void;
};

export function initScene(): SceneAPI {
  // 通过 id 获取要绘制的 canvas；在 React 里通常是通过 ref 绑定的
  const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;

  // WebGL 渲染器：开启抗锯齿，并根据画布尺寸和屏幕像素比设置渲染大小
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  // 创建场景并设置背景色
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // 透视相机：45°视角、近平面 0.1、远平面 1000，并将相机放到 (3,3,3) 看向原点
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  // 一个简单的立方体网格，使用标准材质并着橙色
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: "orange" })
  );
  scene.add(cube);

  // 平行光和环境光：平行光提供主光源方向，环境光提升整体亮度
  const light = new THREE.DirectionalLight("white", 1.2);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight("white", 0.4);
  scene.add(ambient);

  // 控制旋转速度及动画帧 id
  let spinSpeed = 0.01;
  let animationFrameId: number;

  // 每一帧让立方体绕 Y 轴旋转一点，然后渲染场景
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    cube.rotation.y += spinSpeed;
    renderer.render(scene, camera);
  }

  animate();

  // === 对外暴露的控制函数 ===
  const api: SceneAPI = {
    // 设置相机位置，并可选择性传入新的观察点
    setCameraPosition(pos, lookAt = { x: 0, y: 0, z: 0 }) {
      camera.position.set(pos.x, pos.y, pos.z);
      camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    },
    // 提高旋转速度（乘以 1.5）
    spinFaster() {
      spinSpeed *= 1.5;
    },
    // 降低旋转速度（乘以 0.7）
    spinSlower() {
      spinSpeed *= 0.7;
    },
    // 停止动画并释放 WebGL 资源
    dispose() {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      // 释放几何体和材质，加载大模型时可在此扩展更多清理逻辑
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
    },
  };

  // 窗口尺寸变化时同步更新相机宽高比和渲染尺寸
  function onResize() {
    const { clientWidth, clientHeight } = canvas;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  }

  window.addEventListener("resize", onResize);

  // 把移除事件监听也放到 dispose 里，避免内存泄漏
  const originalDispose = api.dispose;
  api.dispose = () => {
    window.removeEventListener("resize", onResize);
    originalDispose();
  };

  return api;
}

import * as THREE from "three";

export type SceneAPI = {
  setCameraPosition: (
    pos: THREE.Vector3Like,
    lookAt?: THREE.Vector3Like
  ) => void;
  focusOnObjectByName: (name: string) => void;
  spinFaster: () => void;
  spinSlower: () => void;
  dispose: () => void;
};

export function initScene(): SceneAPI {
  const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  // 相机平滑飞行所需的状态
  const currentCamPos = new THREE.Vector3().copy(camera.position);
  const currentCamTarget = new THREE.Vector3(0, 0, 0);
  const targetCamPos = new THREE.Vector3().copy(camera.position);
  const targetCamTarget = new THREE.Vector3(0, 0, 0);
  const lerpFactor = 0.08; // 越大飞行越快

  // 一个简单的立方体网格，使用标准材质并着橙色
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: "orange" })
  );
  cube.name = "DemoCube";
  scene.add(cube);

  const light = new THREE.DirectionalLight("white", 1.2);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight("white", 0.4);
  scene.add(ambient);

  let spinSpeed = 0.01;
  let animationFrameId: number;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    cube.rotation.y += spinSpeed;

    // 相机位置和目标的插值更新 ===
    currentCamPos.lerp(targetCamPos, lerpFactor);
    currentCamTarget.lerp(targetCamTarget, lerpFactor);
    camera.position.copy(currentCamPos);
    camera.lookAt(currentCamTarget);

    renderer.render(scene, camera);
  }

  animate();

  // 对外暴露的控制函数
  const setCameraPosition = (
    pos: THREE.Vector3Like,
    lookAt: THREE.Vector3Like = { x: 0, y: 0, z: 0 }
  ) => {
    targetCamPos.set(pos.x, pos.y, pos.z);
    targetCamTarget.set(lookAt.x, lookAt.y, lookAt.z);
  };

  const focusOnObjectByName = (name: string) => {
    const obj = scene.getObjectByName(name);
    if (!obj) {
      console.warn(`[focusOnObjectByName] object not found: ${name}`);
      return;
    }

    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxSize * 3; // 简单估计一个合适距离

    const offset = new THREE.Vector3(distance, distance, distance);
    targetCamPos.copy(center).add(offset);
    targetCamTarget.copy(center);
  };

  const spinFaster = () => {
    spinSpeed *= 1.5;
  };

  const spinSlower = () => {
    spinSpeed *= 0.7;
  };

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
    cube.geometry.dispose();
    (cube.material as THREE.Material).dispose();
  };

  const api: SceneAPI = {
    setCameraPosition,
    focusOnObjectByName,
    spinFaster,
    spinSlower,
    dispose,
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

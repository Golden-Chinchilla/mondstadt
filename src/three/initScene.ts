import * as THREE from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import mondstadtUrl from "../assets/models/mondstadt-city.glb";

export type SceneAPI = {
  setCameraPosition: (
    pos: THREE.Vector3Like,
    lookAt?: THREE.Vector3Like
  ) => void;
  focusOnObjectByName: (name: string) => void;
  dispose: () => void;
};

export function initScene(): SceneAPI {
  // 绑定渲染目标画布，开启抗锯齿
  const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  // 场景与相机
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // 天空蓝背景，方便辨识模型轮廓
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  // 用于相机平滑插值的状态：当前值、目标值以及插值速率
  const currentCamPos = new THREE.Vector3().copy(camera.position);
  const currentCamTarget = new THREE.Vector3(0, 0, 0);
  const targetCamPos = new THREE.Vector3().copy(camera.position);
  const targetCamTarget = new THREE.Vector3(0, 0, 0);
  const lerpFactor = 0.08;

  // 动画开关与阈值，避免相机抖动或永远到不了终点
  let isAnimatingCamera = false;
  const animationThreshold = 0.01; // 两点距离小于该值时视为已到达

  // 计算对象的包围盒信息，方便决定镜头远近
  const getBoundsInfo = (obj: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    return { box, center, size, maxSize };
  };

  // 轨道控制器：可拖拽旋转、缩放
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);
  controls.minDistance = 1;
  controls.maxDistance = 500;

  // 基础光照：方向光 + 环境光，保证模型能被看见
  const light = new THREE.DirectionalLight("white", 1.2);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight("white", 0.6);
  scene.add(ambient);

  // 加载 glb 模型
  const loader = new GLTFLoader();

  loader.load(
    mondstadtUrl,
    (gltf: GLTF) => {
      const root = gltf.scene;
      root.name = "MondstadtTestRoot";
      scene.add(root);

      // 根据模型尺寸自动计算合适的初始视角
      const { center, maxSize, box } = getBoundsInfo(root);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);

      const fitOffset = 1.5; // 让视角稍微拉远一点
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const radius = sphere.radius || maxSize / 2;
      const distance = (radius / Math.sin(fov / 2)) * fitOffset;
      const dir = new THREE.Vector3(0.5, 1, 0.5).normalize();

      const newPosition = sphere.center
        .clone()
        .add(dir.multiplyScalar(distance));

      // 如果依然在包围盒内，则再往外推一段距离，避免视角穿模
      if (box.containsPoint(newPosition)) {
        const extra = box.getSize(new THREE.Vector3()).length();
        newPosition.add(dir.clone().multiplyScalar(extra));
      }

      // 设置相机位置并校准控制器目标点
      camera.position.copy(newPosition);
      controls.target.copy(sphere.center);

      // 同步状态：初始时当前与目标保持一致
      currentCamPos.copy(newPosition);
      targetCamPos.copy(newPosition);
      currentCamTarget.copy(sphere.center);
      targetCamTarget.copy(sphere.center);

      // 根据模型尺寸更新相机裁剪面，避免裁剪错误
      camera.near = Math.max(0.1, radius / 50);
      camera.far = Math.max(camera.near + 1, radius * 20);
      camera.updateProjectionMatrix();
      controls.update();

      // 调试：遍历节点名称，方便找到可聚焦的对象
      root.traverse((obj: THREE.Object3D) => {
        if (obj.name) {
          console.log("Node:", obj.name, obj.type);
        }
      });
    },
    (event: ProgressEvent<EventTarget>) => {
      const progress = (event.loaded / (event.total || 1)) * 100;
      // console.log(`Loading glb: ${progress.toFixed(1)}%`);
    },
    (error: unknown) => {
      console.error("Failed to load glb:", error);
    }
  );

  let animationFrameId: number;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // 只有在启用相机动画时才插值相机位置与目标
    if (isAnimatingCamera) {
      currentCamPos.lerp(targetCamPos, lerpFactor);
      currentCamTarget.lerp(targetCamTarget, lerpFactor);

      camera.position.copy(currentCamPos);
      controls.target.copy(currentCamTarget);

      // 检查是否到达目标位置与目标点
      const posDistance = currentCamPos.distanceTo(targetCamPos);
      const targetDistance = currentCamTarget.distanceTo(targetCamTarget);

      if (
        posDistance < animationThreshold &&
        targetDistance < animationThreshold
      ) {
        isAnimatingCamera = false;
        // 确保最终精确达到目标位置，避免插值残差
        camera.position.copy(targetCamPos);
        controls.target.copy(targetCamTarget);
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // 对外暴露的控制接口：平滑移动相机到指定位置并观看指定目标
  const setCameraPosition = (
    pos: THREE.Vector3Like,
    lookAt: THREE.Vector3Like = { x: 0, y: 0, z: 0 }
  ) => {
    targetCamPos.set(pos.x, pos.y, pos.z);
    targetCamTarget.set(lookAt.x, lookAt.y, lookAt.z);
    isAnimatingCamera = true;
  };

  // 根据名称聚焦场景中的对象，自动计算合适的相机位置
  const defaultDir = new THREE.Vector3(0.5, 1, 0.5).normalize();
  const focusOnObjectByName = (name: string) => {
    const obj = scene.getObjectByName(name);
    if (!obj) {
      console.warn(`[focusOnObjectByName] object not found: ${name}`);
      return;
    }

    const { center, maxSize } = getBoundsInfo(obj);
    const distance = maxSize * 2.5;
    targetCamPos.copy(center).add(defaultDir.clone().multiplyScalar(distance));
    targetCamTarget.copy(center);
    isAnimatingCamera = true;
  };

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
    controls.dispose();
  };

  const api: SceneAPI = {
    setCameraPosition,
    focusOnObjectByName,
    dispose,
  };

  // 监听窗口尺寸变化，保持画布与投影参数同步
  function onResize() {
    const { clientWidth, clientHeight } = canvas;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  }

  window.addEventListener("resize", onResize);

  const originalDispose = api.dispose;
  api.dispose = () => {
    window.removeEventListener("resize", onResize);
    originalDispose();
  };

  return api;
}

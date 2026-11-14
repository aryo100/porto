import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createRecordGallery } from './record-photos.js';
import { prepareRenderPasses, waitForGpu, getRenderPixelRatio } from './loading.js';


const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = t => t * t * (3 - 2 * t);

function getRecordProgressTarget(target, current, archiveComplete) {
  return target > .51 && target > current + .000001 && current < .65 && !archiveComplete ? .51 : target;
}

function createArchiveNodeMotion() {
  let value = 0, transition = null, target = 0, previousProgress = 0, reversing = false;
  return {
    update(progress, dt, motionEnabled = true, forceReveal = false) {
      const direction = progress - previousProgress;
      if (direction > .000001 || progress < .465) reversing = false;
      if (direction < -.000001 && previousProgress >= .60 && progress < .60) {
        // Bring the complete archive back into view before withdrawing it.
        reversing = true;
        value = 1;
        transition = null;
      }
      previousProgress = progress;
      if (forceReveal) reversing = false;
      const next = progress >= .465 && !reversing ? 1 : 0;
      if (next !== target) {
        target = next;
        transition = { from: value, elapsed: 0, duration: target ? 2.4 : 1.35 };
      }
      if (!motionEnabled) { value = target; transition = null; }
      else if (transition) {
        transition.elapsed += dt;
        const t = Math.min(1, transition.elapsed / transition.duration);
        value = transition.from + (target - transition.from) * t * t * (3 - 2 * t);
        if (t >= 1) { value = target; transition = null; }
      }
      return value;
    },
    isMoving() { return Boolean(transition); },
    isComplete() { return target === 1 && value >= 1 - 1e-8 && !transition; }
  };
}

function getRecordPortraitRoll(rotation, cameraRotation) {
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation)
    .applyQuaternion(cameraRotation.clone().invert());
  return Math.atan2(-up.x, up.y);
}

function createPortraitReveal({ wake, onReturn = () => {} }) {
  let interacted = false, angle = 0, returning = null;
  let automaticTurn = 0;
  let frameCount = 1, step = Math.PI * 2, returnDuration = .7;
  function reset() { interacted = false; angle = 0; returning = null; wake(); }
  function beginReturn() {
    onReturn({ angle, duration: returnDuration });
    if (!interacted || returning) return;
    returning = { angle, elapsed: 0 };
    interacted = false;
    wake();
  }
  addEventListener('scroll', beginReturn, { passive: true });
  addEventListener('wheel', beginReturn, { passive: true });
  return {
    configureSequence(count) {
      reset(); frameCount = Math.max(1, count);
      step = Math.PI * 2 / frameCount;
      returnDuration = frameCount > 1 ? 1.35 : .7;
    },
    setAutomaticTurn(value) { automaticTurn = Math.max(0, Math.min(1, value)); },
    sequencePosition(progress) {
      const effectiveAngle = Math.max(-Math.PI * 2, Math.min(0, angle - automaticTurn * Math.PI * 2));
      const position = Math.max(0, -effectiveAngle / step), rounded = Math.round(position);
      return (Math.abs(position - rounded) < 1e-8 ? rounded : position)
        * getPortraitVisibility(automaticTurn > 0 ? Math.min(progress, .51) : progress,
          interacted || automaticTurn > 0 || Boolean(returning), Boolean(returning) || automaticTurn > 0);
    },
    rotate(delta, inertial = false) {
      if (!Number.isFinite(delta) || Math.abs(delta) < .000001 || (inertial && !interacted)) return;
      const effectiveAngle = Math.max(-Math.PI * 2, Math.min(0, angle - automaticTurn * Math.PI * 2));
      const next = Math.max(-Math.PI * 2, Math.min(0, effectiveAngle + delta));
      if (Math.abs(next - effectiveAngle) < .000001) return;
      returning = null;
      interacted = true;
      angle = next + automaticTurn * Math.PI * 2;
      wake();
    },
    reset,
    visibility(progress, dt = 0, motionEnabled = true) {
      if (returning) {
        returning.elapsed += motionEnabled ? dt : returnDuration;
        const t = Math.min(1, returning.elapsed / returnDuration);
        angle = returning.angle * (1 - t * t * (3 - 2 * t));
        if (t >= 1) { returning = null; angle = 0; }
      }
      const gate = getPortraitVisibility(automaticTurn > 0 ? Math.min(progress, .51) : progress,
        interacted || automaticTurn > 0 || Boolean(returning), Boolean(returning) || automaticTurn > 0);
      if (!gate) { interacted = false; angle = 0; returning = null; }
      const effectiveAngle = Math.max(-Math.PI * 2, Math.min(0, angle - automaticTurn * Math.PI * 2));
      const rawTurn = -effectiveAngle / step - (frameCount - 1);
      const turn = rawTurn < 1e-8 ? 0 : Math.max(0, Math.min(1, rawTurn));
      return gate * turn * turn * (3 - 2 * turn);
    },
    isReturning() { return Boolean(returning); },
    dispose() { removeEventListener('scroll', beginReturn); removeEventListener('wheel', beginReturn); }
  };
}

function getPortraitVisibility(progress, interacted = false, returning = false) {
  if (!interacted) return 0;
  if (!returning) return progress >= .38 && progress <= .55 ? 1 : 0;
  const ease = (start, end) => {
    const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };
  return ease(.31, .38) * (1 - ease(.55, .64));
}

function createPortraitMask(source, width, height) {
  // Key only background connected to the image edge; enclosed white shirts/eyes survive.
  const count = width * height, buckets = new Map();
  const sample = index => {
    const i = index * 4;
    if (source[i + 3] < 24) return;
    const key = [0, 1, 2].map(c => Math.round(source[i + c] / 32)).join(',');
    const bucket = buckets.get(key) || [0, 0, 0, 0];
    bucket[0]++; for (let c = 0; c < 3; c++) bucket[c + 1] += source[i + c];
    buckets.set(key, bucket);
  };
  for (let x = 0; x < width; x++) { sample(x); sample((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { sample(y * width); sample(y * width + width - 1); }
  const dominant = [...buckets.values()].sort((a, b) => b[0] - a[0])[0] || [1, 255, 255, 255];
  const background = dominant.slice(1).map(value => value / dominant[0]);
  const visited = new Uint8Array(count), queue = new Int32Array(count);
  let head = 0, tail = 0;
  function enqueue(index) {
    if (visited[index]) return;
    const i = index * 4;
    const distance = Math.hypot(source[i] - background[0], source[i + 1] - background[1], source[i + 2] - background[2]);
    if (source[i + 3] > 24 && distance > 55) return;
    visited[index] = 1; queue[tail++] = index;
  }
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width);
    if (x) enqueue(index - 1); if (x < width - 1) enqueue(index + 1);
    if (y) enqueue(index - width); if (y < height - 1) enqueue(index + width);
  }
  const pixels = new Uint8ClampedArray(source.length);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let index = 0; index < count; index++) {
    const i = index * 4;
    if (visited[index] || source[i + 3] < 8) continue;
    const x = index % width, y = Math.floor(index / width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    // Positive black-ink alpha: dark details stay black, light areas reveal the metal.
    const light = (source[i] * .2126 + source[i + 1] * .7152 + source[i + 2] * .0722) / 255;
    const ink = Math.max(0, Math.min(1, (.92 - light) / .78));
    pixels[i + 3] = Math.round(Math.pow(ink, .78) * source[i + 3] * .97);
  }
  const bounds = maxX < 0 ? { x: 0, y: 0, width, height }
    : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  return { pixels, bounds };
}

function replaceRecordReverse(model, finish) {
  let parent;
  model.traverse(object => {
    if (object.isMesh) parent ||= object.parent;
  });
  if (!parent) return;
  // Stay inside the original black inset (radius 50), preserving all outer gold grooves.
  const geometry = new THREE.CircleGeometry(49.6, 192);
  geometry.rotateY(Math.PI);
  geometry.translate(107.95958709716797, 102.47310638427734, -1.102);
  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2), colors = new Float32Array(positions.count * 3).fill(1);
  for (let i = 0; i < positions.count; i++) {
    const u = (positions.getX(i) - 7.959587097167969) / 200;
    uvs[i * 2] = .5 + (1 - u) * .5;
    uvs[i * 2 + 1] = (positions.getY(i) - 2.4731063842773438) / 200;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const rear = new THREE.Mesh(geometry, finish);
  rear.name = 'PortraitReverse';
  rear.visible = false;
  rear.renderOrder = 1;
  finish.transparent = true;
  finish.depthWrite = false;
  finish.side = THREE.FrontSide;
  parent.add(rear);
  return rear;
}

function createRecordPortrait({ renderer, mount, wake }) {
  const empty = new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat);
  empty.needsUpdate = true;
  const state = { texture: { value: empty }, strength: { value: 0 }, ready: { value: 0 }, roll: { value: 0 } };
  const controller = new AbortController();
  let timer, stopped = false, revision = '', busy = false;
  async function refresh() {
    if (busy || stopped || document.hidden) return;
    busy = true;
    try {
      const response = await fetch('/assets/image.jpg', {
        cache: 'no-store', signal: controller.signal,
        headers: revision ? { 'If-None-Match': revision } : {}
      });
      if (response.status === 304) return;
      if (!response.ok) {
        if (response.status === 404) { state.ready.value = 0; revision = ''; wake(); }
        mount.dataset.portraitStatus = 'waiting-for-image';
        return;
      }
      const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'from-image' });
      if (stopped) { bitmap.close(); return; }
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(bitmap.width * scale));
      source.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = source.getContext('2d', { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0, source.width, source.height); bitmap.close();
      const input = context.getImageData(0, 0, source.width, source.height);
      const { pixels, bounds } = createPortraitMask(input.data, source.width, source.height);
      context.putImageData(new ImageData(pixels, source.width, source.height), 0, 0);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
      const draw = canvas.getContext('2d');
      const fit = Math.max(1024 / bounds.width, 1024 / bounds.height);
      const width = bounds.width * fit, height = bounds.height * fit;
      // Cover the circular label while retaining the top of a portrait; excess lower content is cropped.
      draw.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, (1024 - width) / 2, 0, width, height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      state.texture.value.dispose(); state.texture.value = texture; state.ready.value = 1;
      revision = response.headers.get('ETag') || '';
      mount.dataset.portraitStatus = 'ready';
      mount.dataset.portraitRevision = revision;
      mount.dataset.portraitFilter = 'positive-black-ink-transparent-highlights';
      wake();
    } catch (error) {
      if (!stopped) mount.dataset.portraitStatus = 'retrying';
    } finally { busy = false; }
  }
  function schedule() { refresh(); timer = setTimeout(schedule, 2500); }
  schedule();
  return { ...state, dispose() { stopped = true; clearTimeout(timer); controller.abort(); state.texture.value.dispose(); } };
}

function createRecordFinish(portrait = null) {
  const faceSize = 512, width = faceSize * 2;
  const bumpPixels = new Uint8Array(width * faceSize * 4);
  const roughnessPixels = new Uint8Array(bumpPixels.length);
  const directionPixels = new Uint8Array(bumpPixels.length);
  let seed = 1977;
  for (let y = 0; y < faceSize; y++) for (let x = 0; x < width; x++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = seed / 4294967296 - .5;
    const dx = ((x % faceSize) + .5) / faceSize - .5;
    const dy = (y + .5) / faceSize - .5;
    const radius = Math.hypot(dx, dy);
    const back = x >= faceSize;
    const grooves = back ? Math.sin(radius * 5800) : Math.sin((dx + dy) * 4000 + Math.sin((dx - dy) * 31) * .35);
    const bump = Math.round(128 + grooves * 7 + noise * 11);
    const roughness = Math.round((back ? 180 : 165) + grooves * 10 + noise * 24);
    const i = (y * width + x) * 4;
    bumpPixels.set([bump, bump, bump, 255], i);
    roughnessPixels.set([roughness, roughness, roughness, 255], i);
    const angle = back ? Math.atan2(dy, dx) + Math.PI / 2 : Math.PI / 4;
    directionPixels.set([Math.round((Math.cos(angle) * .5 + .5) * 255), Math.round((Math.sin(angle) * .5 + .5) * 255), 230, 255], i);
  }
  const makeSurfaceMap = pixels => {
    const texture = new THREE.DataTexture(pixels, width, faceSize, THREE.RGBAFormat);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xe8b12c, metalness: 1, roughness: .36, vertexColors: true,
    bumpMap: makeSurfaceMap(bumpPixels), bumpScale: .002,
    roughnessMap: makeSurfaceMap(roughnessPixels),
    anisotropy: .82, anisotropyMap: makeSurfaceMap(directionPixels),
    envMapIntensity: .3, side: THREE.DoubleSide
  });
  // Gold and grain remain physical; the optional portrait controls only black ink opacity.
  material.onBeforeCompile = shader => {
    if (portrait) {
      shader.uniforms.recordPortrait = portrait.texture;
      shader.uniforms.recordPortraitRoll = portrait.roll;
      shader.fragmentShader = 'uniform sampler2D recordPortrait;\nuniform float recordPortraitRoll;\n' + shader.fragmentShader;
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 recordFaceUv = vec2(fract(vBumpMapUv.x * 2.0), vBumpMapUv.y);
      float recordRadius = length((recordFaceUv - 0.5) * 2.0);
      float recordBand = smoothstep(0.34, 0.35, recordRadius) * (1.0 - smoothstep(0.49, 0.50, recordRadius));
      float recordSide = step(0.5, vBumpMapUv.x);
      ${portrait ? `vec2 portraitPoint = (recordFaceUv - 0.5) / 0.496;
      float portraitCos = cos(recordPortraitRoll), portraitSin = sin(recordPortraitRoll);
      vec2 portraitUv = vec2(portraitCos * portraitPoint.x - portraitSin * portraitPoint.y,
        portraitSin * portraitPoint.x + portraitCos * portraitPoint.y) + 0.5;
      float portraitInk = texture2D(recordPortrait, portraitUv).a;
      diffuseColor.rgb *= mix(1.0, 0.018, portraitInk * recordSide);` : 'diffuseColor.rgb *= mix(1.0, 0.035, recordBand * recordSide);'}
    `);
  };
  material.customProgramCacheKey = () => portrait ? 'procedural-gold-upright-portrait-v3' : 'procedural-brushed-gold-v1';
  return material;
}

// Each position is normalized to the camera viewport. Rotations are radians.
const discFrames = [
  { at: 0, x: .235, y: -.01, scale: 1.10, rotation: [0, 0, 0] },
  { at: .22, x: .20, y: .01, scale: 1.04, rotation: [0, 0, 0] },
  { at: .38, x: -.235, y: 0, scale: 1.02, rotation: [0, Math.PI, 0] },
  { at: .51, x: -.235, y: 0, scale: 1.02, rotation: [0, Math.PI, 0] },
  { at: .70, x: -.235, y: 0, scale: 1.02, rotation: [0, Math.PI, 0] },
  { at: 1, x: -.235, y: 0, scale: 1.02, rotation: [0, Math.PI, 0] }
];
const shipFrames = [
  { at: 0, x: .28, y: -.06, scale: .001, rotation: [Math.PI / 2, 0, Math.PI / 4] },
  { at: .48, x: .36, y: -.06, scale: .001, rotation: [Math.PI / 2, 0, Math.PI / 4] },
  { at: .70, x: .2266904132, y: .038992469, scale: .8932383472, rotation: [Math.PI / 2, 0, Math.PI / 4] },
  { at: .88, x: .2266904132, y: .038992469, scale: .8932383472, rotation: [Math.PI / 2, 0, Math.PI / 4] },
  { at: 1, x: .2266904132, y: .038992469, scale: .8932383472, rotation: [Math.PI / 2, 0, Math.PI / 4] }
];

function measureVoyagerDish(model) {
  model.updateMatrixWorld(true);
  const dish = model.getObjectByName('tex_02_AO');
  const bounds = new THREE.Box3().setFromObject(dish, true);
  const size = bounds.getSize(new THREE.Vector3());
  return { pivot: model.worldToLocal(bounds.getCenter(new THREE.Vector3())), radius: Math.max(size.x, size.z) * .5 };
}

function createModelFade(group, closedSurface = false) {
  const materials = new Map();
  group.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!materials.has(material)) materials.set(material, {
        opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite, side: material.side
      });
    }
  });
  return opacity => {
    const fading = opacity < .9999;
    for (const [material, original] of materials) {
      const transparent = fading || original.transparent;
      const side = fading && closedSurface ? THREE.FrontSide : original.side;
      if (material.transparent !== transparent || material.side !== side) {
        material.transparent = transparent;
        material.side = side;
        material.needsUpdate = true;
      }
      material.opacity = original.opacity * opacity;
      material.depthWrite = fading && !closedSurface ? false : original.depthWrite;
    }
    group.visible = group.visible && opacity > .001;
  };
}

function sample(frames, progress) {
  const index = frames.findIndex((frame, i) => i < frames.length - 1 && progress <= frames[i + 1].at);
  const a = frames[index < 0 ? frames.length - 2 : index];
  const b = frames[index < 0 ? frames.length - 1 : index + 1];
  const t = smooth(clamp((progress - a.at) / (b.at - a.at), 0, 1));
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), scale: lerp(a.scale, b.scale, t),
    rotation: a.rotation.map((value, i) => lerp(value, b.rotation[i], t))
  };
}

function normalizeModel(model, diameter) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(center);
  const normalized = new THREE.Group();
  normalized.add(model);
  normalized.scale.setScalar(diameter / Math.max(size.x, size.y, size.z));
  const group = new THREE.Group();
  group.add(normalized);
  return group;
}

export async function createVoyagerScene({ mount, viewport, onStatus, onFrame, paused: initialPaused }) {
  RectAreaLightUniformsLib.init();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x0b100e, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .68;
  renderer.autoClear = false;
  renderer.info.autoReset = false;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  const discScene = new THREE.Scene();
  const shipScene = new THREE.Scene();
  // Fade the complete depth-tested Voyager image, never its individual meshes.
  const shipTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 });
  const shipComposite = new THREE.Scene();
  const compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const shipCompositeMaterial = new THREE.ShaderMaterial({
    uniforms: { image: { value: shipTarget.texture }, opacity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D image; uniform float opacity; varying vec2 vUv;
      void main() {
        vec4 surface = texture2D(image, vUv);
        if (surface.a > 0.0001) surface.rgb /= surface.a;
        gl_FragColor = vec4(surface.rgb, surface.a * opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthTest: false, depthWrite: false
  });
  shipComposite.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shipCompositeMaterial));
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 90);
  camera.position.set(0, 0, 9.4);
  // An orthographic disc pass keeps its visual center and radius stable at every angle.
  // The stars and Voyager retain their existing perspective camera.
  const discCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 90);
  discCamera.position.copy(camera.position);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .035);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .045;
  discScene.environment = environmentTarget.texture;
  discScene.environmentIntensity = .045;
  shipScene.environment = environmentTarget.texture;
  shipScene.environmentIntensity = .045;
  environment.dispose();
  pmrem.dispose();

  const discLightRig = new THREE.Group();
  const addSoftbox = (color, intensity, width, height, position, roll) => {
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    light.position.set(...position);
    light.lookAt(0, 0, 0);
    light.rotateZ(roll);
    discLightRig.add(light);
    return light;
  };
  addSoftbox(0xffedbf, 4, 7.5, .45, [.55, .1, 3.5], Math.PI / 4);
  addSoftbox(0xffcf73, 2, 6, .16, [-1, -.9, 2.8], Math.PI / 4);
  addSoftbox(0xffe8b7, 1.2, 2, 4.5, [-3.5, 2, 2.2], -.25);
  discScene.add(discLightRig);
  // Voyager shares the record's warm softboxes and low environment illumination.
  const shipLightRig = discLightRig.clone();
  shipScene.add(shipLightRig);

  // Deterministic star positions keep refreshes and scroll reversal consistent.
  const starPositions = new Float32Array(360 * 3);
  let seed = 1977;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < starPositions.length; i += 3) {
    starPositions[i] = (random() - .5) * 34;
    starPositions[i + 1] = (random() - .5) * 20;
    starPositions[i + 2] = -3 - random() * 24;
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xc3b996, size: .018, transparent: true, opacity: .65, depthWrite: false });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  const loader = new GLTFLoader();
  let disc, ship;
  let shipHalfHeight = 0;
  const shipPivot = new THREE.Vector3();
  let shipDishRadius = .75;
  let desktopBlend = 0;
  let compactLayoutBlend = 0;
  let fadeDisc = () => {};
  let targetProgress = 0;
  let currentProgress = 0;
  let paused = initialPaused;
  let isVisible = true;
  let contextLost = false;
  let disposed = false;
  let assetsPrepared = false;
  let raf = 0;
  let lastTime = 0;
  let archiveReady = false;
  let revealRequested = false, bypassArchiveExit = false, showArchiveImmediately = false;
  let viewWidth = 1;
  let viewHeight = 1;
  let isMobile = false;
  let flightDistance = 1, viewportWidth = 1, viewportHeight = 1;
  let renderCpuAverage = 0;
  const portraitReveal = createPortraitReveal({ wake,
    onReturn: ({ angle, duration }) => discInteraction.returnToDefault({ duration, spinAngle: angle }) });
  const discInteraction = createDiscInteraction({ viewport, camera: discCamera, getProgress: () => currentProgress, wake,
    onRotate: portraitReveal.rotate, onReset: portraitReveal.reset });
  const recordGallery = createRecordGallery({ viewport, mount, reveal: portraitReveal, wake });
  const archiveNodeMotion = createArchiveNodeMotion();
  const archiveRotation = new THREE.Quaternion();
  const archiveAxis = new THREE.Vector3(0, 0, 1);
  const galleryOrigin = new THREE.Vector3();
  const shipInteraction = createDiscInteraction({
    viewport, camera, getProgress: () => currentProgress, wake, kind: 'voyager',
    pivot: shipPivot, getRadius: () => shipDishRadius
  });

  function resize() {
    const { width, height } = viewport.getBoundingClientRect();
    viewportWidth = width; viewportHeight = height;
    flightDistance = viewport.closest('.flight').offsetHeight - height;
    isMobile = width <= 700;
    desktopBlend = smooth(clamp((width - 700) / 740, 0, 1));
    compactLayoutBlend = smooth(clamp((width - 600) / 200, 0, 1));
    renderer.setPixelRatio(getRenderPixelRatio(width, height, devicePixelRatio));
    renderer.setSize(width, height, false);
    const bufferSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    shipTarget.setSize(bufferSize.x, bufferSize.y);
    mount.dataset.renderPixels = String(bufferSize.x * bufferSize.y);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    viewWidth = viewHeight * camera.aspect;
    discCamera.left = -viewWidth / 2;
    discCamera.right = viewWidth / 2;
    discCamera.top = viewHeight / 2;
    discCamera.bottom = -viewHeight / 2;
    discCamera.updateProjectionMatrix();
    wake();
  }

  function applyTransform(group, frame, kind) {
    if (!group) return;
    if (isMobile) {
      const factor = kind === 'disc' ? .50 : .46;
      group.position.set(viewWidth * .08, -viewHeight * (kind === 'disc' ? .245 : .205), 0);
      group.scale.setScalar(frame.scale * factor * Math.min(1, viewWidth / 3.1));
    } else {
      group.position.set(frame.x * viewWidth, frame.y * viewHeight, 0);
      group.scale.setScalar(frame.scale * Math.min(1, viewWidth / 9.2));
    }
    group.rotation.set(...frame.rotation);
    if (kind === 'ship') {
      group.position.y -= shipHalfHeight * .5 * group.scale.y;
      // Increase the prior horizontal screen position by 25%, measured from the left edge.
      const previousScreenX = .5 + frame.x - .14;
      const desktopX = lerp(.18, previousScreenX * 1.25 - .5, desktopBlend);
      group.position.x = lerp(-.06, desktopX, compactLayoutBlend) * viewWidth;
    }
    group.visible = frame.scale > .005;
  }

  function render(time) {
    raf = 0;
    if (disposed || contextLost || !isVisible || document.hidden || !assetsPrepared) return;
    const cpuStart = performance.now();
    const dt = Math.min((time - (lastTime || time)) / 1000, .06);
    lastTime = time;
    const requested = paused ? (targetProgress < .27 ? 0 : targetProgress < .64 ? (targetProgress < .465 ? .42 : .51) : .88) : targetProgress;
    const archiveCanExit = archiveReady;
    const desired = bypassArchiveExit ? requested : getRecordProgressTarget(requested, currentProgress, archiveCanExit);
    const waitingForArchive = !bypassArchiveExit && revealRequested && !archiveCanExit;
    const jumpToArchive = showArchiveImmediately && desired >= .465 && desired <= .51;
    showArchiveImmediately = false;
    currentProgress = paused || jumpToArchive ? desired : lerp(currentProgress, desired, 1 - Math.exp(-dt * 8));
    if (Math.abs(currentProgress - desired) < .00005) currentProgress = desired;
    applyTransform(disc, sample(discFrames, currentProgress), 'disc');
    applyTransform(ship, sample(shipFrames, currentProgress), 'ship');
    // Match the text's ordinary upward scroll in CSS pixels, retaining the full disc pose.
    const recordExitPixels = Math.max(0, currentProgress - .51)
      * flightDistance;
    if (disc) {
      disc.position.y += recordExitPixels / viewportHeight * viewHeight;
      // The dense engraved mesh contributes nothing after it has scrolled beyond the view.
      if (disc.position.y - 2.2 * disc.scale.y > viewHeight / 2) disc.visible = false;
    }
    const discOpacity = 1;
    const shipOpacity = smooth(clamp((currentProgress - .59) / .11, 0, 1));
    // One gentle vertical cycle across section 3, reversible with scroll and zero at pose 88.
    const shipBob = paused ? 0 : Math.sin((currentProgress - .88) / .30 * Math.PI * 2)
      * viewHeight * .012 * shipOpacity;
    if (ship) ship.position.y += shipBob;
    fadeDisc(discOpacity);
    if (ship) ship.visible = ship.visible && shipOpacity > .001;
    shipCompositeMaterial.uniforms.opacity.value = shipOpacity;
    if (ship) shipLightRig.position.copy(ship.position);
    const discMoving = discInteraction.update(disc, dt, !paused);
    const automaticTurn = archiveNodeMotion.update(currentProgress, dt, !paused && !jumpToArchive, waitingForArchive || jumpToArchive);
    portraitReveal.setAutomaticTurn(automaticTurn);
    if (disc && automaticTurn) {
      archiveRotation.setFromAxisAngle(archiveAxis, -Math.PI * 2 * automaticTurn);
      disc.quaternion.premultiply(archiveRotation);
    }
    mount.dataset.archiveNode = targetProgress >= .465 && targetProgress < .65 ? 'photos' : 'nasa';
    mount.dataset.archiveAutomaticTurn = automaticTurn.toFixed(4);
    portraitReveal.visibility(currentProgress, dt, !paused);
    mount.dataset.portraitVisibility = '0.0000';
    mount.dataset.recordDisplay = 'nasa';
    mount.dataset.recordExitPixels = recordExitPixels.toFixed(2);
    mount.dataset.archiveExitWaiting = String(waitingForArchive);
    let galleryMoving = false;
    if (disc) {
      galleryOrigin.copy(disc.position).project(discCamera);
      galleryMoving = recordGallery.update(currentProgress, { x: (galleryOrigin.x + 1) * viewportWidth / 2,
        y: (1 - galleryOrigin.y) * viewportHeight / 2 }, dt, !paused);
    }
    archiveReady = recordGallery.isComplete() && archiveNodeMotion.isComplete();
    const shipMoving = shipInteraction.update(ship, dt, !paused);
    if (disc) {
      discLightRig.position.copy(disc.position);
      discLightRig.scale.copy(disc.scale);
    }
    if (ship) {
      shipLightRig.scale.copy(ship.scale);
    }
    const detailDimmer = smooth(clamp((currentProgress - .27) / .11, 0, 1))
      * (1 - smooth(clamp((currentProgress - .58) / .10, 0, 1)));
    renderer.toneMappingExposure = lerp(.9, .78, detailDimmer);
    stars.rotation.y = paused ? 0 : currentProgress * .12;
    stars.position.z = paused ? 0 : currentProgress * 3;
    renderer.info.reset();
    const shipFading = ship?.visible && shipOpacity < .999;
    if (shipFading) {
      renderer.setRenderTarget(shipTarget);
      renderer.clear();
      renderer.render(shipScene, camera);
      renderer.setRenderTarget(null);
    }
    renderer.clear();
    renderer.render(scene, camera);
    if (shipFading) renderer.render(shipComposite, compositeCamera);
    else if (ship?.visible) renderer.render(shipScene, camera);
    renderer.clearDepth();
    renderer.toneMappingExposure = lerp(.9, .78, detailDimmer);
    renderer.render(discScene, discCamera);
    onFrame(currentProgress);
    // This DOM mirror exposes only the rendered state, useful for local QA.
    mount.dataset.progress = currentProgress.toFixed(4);
    mount.dataset.discRotation = disc ? disc.rotation.y.toFixed(4) : 'pending';
    mount.dataset.discQuaternion = disc ? disc.quaternion.toArray().map(value => value.toFixed(4)).join(',') : 'pending';
    mount.dataset.voyagerVisible = String(Boolean(ship?.visible));
    mount.dataset.discOpacity = discOpacity.toFixed(4);
    mount.dataset.voyagerOpacity = shipOpacity.toFixed(4);
    mount.dataset.voyagerLayout = desktopBlend.toFixed(4);
    mount.dataset.voyagerBob = shipBob.toFixed(4);
    mount.dataset.voyagerScreenX = ship ? (.5 + ship.position.x / viewWidth).toFixed(4) : 'pending';
    mount.dataset.voyagerQuaternion = ship ? ship.quaternion.toArray().map(value => value.toFixed(4)).join(',') : 'pending';
    mount.dataset.drawCalls = String(renderer.info.render.calls);
    mount.dataset.triangles = String(renderer.info.render.triangles);
    mount.dataset.shipRenderPass = !ship?.visible ? 'hidden' : shipFading ? 'fade-buffer' : 'direct';
    renderCpuAverage = renderCpuAverage ? lerp(renderCpuAverage, performance.now() - cpuStart, .15) : performance.now() - cpuStart;
    mount.dataset.renderCpuMs = renderCpuAverage.toFixed(2);
    if (Math.abs(currentProgress - desired) > .00005 || discMoving || shipMoving || portraitReveal.isReturning() || archiveNodeMotion.isMoving() || galleryMoving || waitingForArchive) wake();
  }
  function wake() {
    if (!raf && !disposed && isVisible && !contextLost && !document.hidden) raf = requestAnimationFrame(render);
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const observer = new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting;
    if (isVisible) { lastTime = 0; wake(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  observer.observe(viewport);
  const handleVisibility = () => {
    if (!document.hidden) { lastTime = 0; wake(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    document.body.classList.remove('scene-ready');
    document.body.classList.add('scene-failed');
    onStatus('3D PAUSED — GRAPHICS CONTEXT LOST');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    document.body.classList.remove('scene-failed');
    if (disc) document.body.classList.add('scene-ready');
    onStatus('3D RESTORED — CONTINUE EXPLORING');
    wake();
  });

  // Both models load independently so a single failed asset does not remove the journey.
  const modelResults = await Promise.allSettled([
    loader.loadAsync('/models/disc/scene.gltf').then(gltf => {
      if (disposed) return;
      // Sketchfab's root rotates the source XY disc -90° around X. Face it toward the camera.
      gltf.scene.rotation.x = Math.PI / 2;
      const finish = createRecordFinish();
      gltf.scene.traverse(object => {
        if (!object.isMesh) return;
        object.material.dispose();
        // Coordinates drive procedural grain only; engraved details come from the original mesh.
        const positions = object.geometry.attributes.position;
        const uvs = new Float32Array(positions.count * 2);
        const colors = new Float32Array(positions.count * 3);
        for (let i = 0; i < positions.count; i++) {
          const u = (positions.getX(i) - 7.959587097167969) / 200;
          const v = (positions.getY(i) - 2.4731063842773438) / 200;
          const front = positions.getZ(i) >= 0;
          uvs[i * 2] = front ? u * .5 : .5 + (1 - u) * .5;
          uvs[i * 2 + 1] = v;
          // Darken the real recessed metal, never draw new engraving over the mesh.
          const relief = THREE.MathUtils.smoothstep(Math.abs(positions.getZ(i)), .34, 1.10);
          const occlusion = lerp(.085, 1, relief);
          colors.set([occlusion, occlusion, occlusion], i * 3);
        }
        object.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        object.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        object.material = finish;
      });
      disc = normalizeModel(gltf.scene, 4.0);
      disc.name = 'GoldenRecord';
      fadeDisc = createModelFade(disc, true);
      discScene.add(disc);
      document.body.classList.add('scene-ready');
      mount.dataset.discLoaded = 'true';
      mount.dataset.discFinish = 'procedural-gold-original-nasa';
      onStatus('GOLDEN RECORD RECEIVED · VOYAGER INBOUND');
      wake();
    }),
    loader.loadAsync('/models/voyager.glb').then(gltf => {
      if (disposed) return;
      gltf.scene.traverse(object => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.envMapIntensity = .3;
          if (material.map) material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }
      });
      ship = normalizeModel(gltf.scene, 6.3);
      ship.name = 'Voyager1';
      const dishFrame = measureVoyagerDish(ship);
      shipPivot.copy(dishFrame.pivot);
      shipDishRadius = dishFrame.radius;
      // Measure the full rotated model once, including its long antenna.
      ship.rotation.set(...shipFrames[0].rotation);
      const shipSize = new THREE.Box3().setFromObject(ship, true).getSize(new THREE.Vector3());
      shipHalfHeight = shipSize.y * .5;
      shipScene.add(ship);
      mount.dataset.voyagerLoaded = 'true';
      wake();
    }),
    recordGallery.ready
  ]);
  const failures = modelResults.filter(result => result.status === 'rejected');
  if (failures.length) {
    document.body.classList.add('scene-failed');
    onStatus(failures.length === 2 ? 'MODELS UNAVAILABLE — EXPLORE THE ARCHIVE BELOW' : 'ONE MODEL UNAVAILABLE — PARTIAL 3D JOURNEY');
    failures.forEach(result => console.error('Model loading failed:', result.reason));
    throw new AggregateError(failures.map(result => result.reason), 'The archive assets could not all be loaded');
  } else onStatus('BOTH SIGNALS RECEIVED · SCROLL TO EXPLORE');

  // Upload textures and first-use geometry work while the loading screen is visible.
  disc.visible = ship.visible = true;
  const textures = new Set();
  for (const model of [disc, ship]) model.traverse(object => {
    if (object.geometry) {
      object.geometry.computeBoundingBox(); object.geometry.computeBoundingSphere();
    }
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
      for (const value of Object.values(material)) if (value?.isTexture && !value.isRenderTargetTexture) textures.add(value);
    }
  });
  textures.forEach(texture => renderer.initTexture(texture));
  applyTransform(disc, sample(discFrames, .42), 'disc');
  applyTransform(ship, sample(shipFrames, .88), 'ship');
  discLightRig.position.copy(disc.position); discLightRig.scale.copy(disc.scale);
  shipLightRig.position.copy(ship.position); shipLightRig.scale.copy(ship.scale);
  shipCompositeMaterial.uniforms.opacity.value = 1;
  const warmupPasses = [
    { scene: shipScene, camera, target: shipTarget },
    { scene: shipScene, camera, target: null },
    { scene, camera, target: null },
    { scene: shipComposite, camera: compositeCamera, target: null },
    { scene: discScene, camera: discCamera, target: null }
  ];
  await prepareRenderPasses(renderer, warmupPasses);
  applyTransform(disc, sample(discFrames, 0), 'disc');
  await prepareRenderPasses(renderer, [{ scene: discScene, camera: discCamera, target: null }]);
  await waitForGpu(renderer);
  mount.dataset.gpuWarmupPasses = String(warmupPasses.length + 1);
  mount.dataset.warmupRenderPixels = mount.dataset.renderPixels;
  mount.dataset.gpuReady = 'true';
  assetsPrepared = true;
  mount.dataset.assetsReady = 'true';
  wake();

  function canExitArchive() {
    return archiveReady && archiveNodeMotion.isComplete() && recordGallery.isComplete(currentProgress);
  }
  return {
    setProgress(progress, { bypass = false } = {}) {
      const requested = clamp(progress, 0, 1);
      bypassArchiveExit = bypass;
      const accepted = bypass ? requested : getRecordProgressTarget(requested, currentProgress, canExitArchive());
      if (accepted < requested) revealRequested = true;
      else if (requested < .465 || requested > .51) revealRequested = false;
      targetProgress = accepted; wake();
      return accepted;
    },
    canExitArchive,
    requestArchiveReveal({ immediate = false } = {}) {
      revealRequested = true;
      showArchiveImmediately ||= immediate;
      targetProgress = Math.min(targetProgress, .51);
      wake();
    },
    setPaused(value) { paused = value; wake(); },
    dispose() {
      disposed = true;
      portraitReveal.dispose();
      recordGallery.dispose();
      discInteraction.dispose();
      shipInteraction.dispose();
      shipTarget.dispose();
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      const resources = new Set();
      [scene, discScene, shipScene, shipComposite].forEach(renderScene => renderScene.traverse(object => {
        if (object.geometry) resources.add(object.geometry);
        if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const value of Object.values(material)) if (value?.isTexture) {
            resources.add(value);
            if (typeof value.source?.data?.close === 'function') value.source.data.close();
          }
          resources.add(material);
        }
      }));
      resources.forEach(resource => resource.dispose());
      environmentTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

const { Euler, Quaternion, Vector3 } = THREE;

const clampInteraction = value => Math.max(0, Math.min(1, value));
const smoothInteraction = value => { const t = clampInteraction(value); return t * t * (3 - 2 * t); };

function createDiscInteraction({ viewport, camera, getProgress, wake, kind = 'disc',
  pivot = new Vector3(), interactionRadius = 2.02, getRadius = () => interactionRadius,
  onRotate = () => {}, onReset = () => {} }) {
  const surface = document.createElement('button');
  surface.type = 'button';
  surface.className = kind === 'voyager' ? 'disc-interaction voyager-interaction' : 'disc-interaction';
  surface.dataset.model = kind;
  surface.hidden = true;
  viewport.append(surface);

  let mode = null;
  const pointers = new Map();
  let gesture = null;
  let dragBounds = null;
  let pendingGestureTime = null;
  let flatSpin = 0;
  let spinVelocity = 0;
  let lastInputTime = 0;
  let lastMoveTime = -Infinity;
  const angularVelocity = new Vector3();
  const rotationBefore = new Quaternion();
  const motionDelta = new Quaternion();
  const motionAxis = new Vector3();
  const viewAxis = new Vector3(0, 0, 1);
  const freeRotation = new Quaternion();
  const deltaRotation = new Quaternion();
  const blendedRotation = new Quaternion();
  const identity = new Quaternion();
  const baseRotation = new Quaternion();
  const previousBaseRotation = new Quaternion();
  const previousRenderedRotation = new Quaternion();
  let previousProgress = null;
  let hasPreviousPose = false;
  let resetTransition = null;
  let timedReturn = null;
  const deltaEuler = new Euler();
  const center = new Vector3();
  const pivotOffset = new Vector3();
  const pivotAnchor = new Vector3();
  const edge = new Vector3();
  const trackballFrom = new Vector3();
  const trackballTo = new Vector3();

  function stopMomentum() {
    spinVelocity = 0;
    angularVelocity.set(0, 0, 0);
  }

  function beginReset(target, progress) {
    resetTransition = hasPreviousPose ? {
      start: previousProgress ?? progress,
      target,
      rotation: previousBaseRotation.clone().invert().premultiply(previousRenderedRotation)
    } : null;
    flatSpin = 0;
    freeRotation.identity();
    stopMomentum();
  }

  function returnToDefault({ duration = .7, spinAngle } = {}) {
    if (timedReturn || !hasPreviousPose) return;
    const rotation = previousBaseRotation.clone().invert().premultiply(previousRenderedRotation);
    const actualSpin = 2 * Math.atan2(rotation.z, rotation.w);
    const flatAngle = mode === 'flat' && Number.isFinite(spinAngle)
      ? actualSpin + Math.round((spinAngle - actualSpin) / (Math.PI * 2)) * Math.PI * 2 : null;
    if (rotation.angleTo(identity) < .000001 && !flatAngle) return;
    timedReturn = { rotation, elapsed: 0, duration, flatAngle };
    resetTransition = null;
    flatSpin = 0;
    freeRotation.identity();
    releaseAllPointers();
    wake();
  }

  function resumeDisplayedRotation() {
    if (!timedReturn) return;
    const rotation = previousBaseRotation.clone().invert().premultiply(previousRenderedRotation);
    if (mode === 'flat') flatSpin = 2 * Math.atan2(rotation.z, rotation.w);
    else freeRotation.copy(rotation);
    timedReturn = null;
  }

  function resetDestination(progress, direction) {
    if (kind === 'voyager') return direction < 0 ? .59 : .70;
    return direction < 0 ? (progress > .55 ? .55 : .17) : (progress < .38 ? .38 : .70);
  }

  function updatePointerState() {
    surface.classList.toggle('is-dragging', pointers.size > 0);
    surface.dataset.pointerCount = String(pointers.size);
  }

  function releaseAllPointers() {
    const ids = [...pointers.keys()];
    pointers.clear();
    gesture = null;
    dragBounds = null;
    pendingGestureTime = null;
    stopMomentum();
    ids.forEach(id => { if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id); });
    updatePointerState();
  }

  function pairGesture() {
    if (pointers.size !== 2) return null;
    const [a, b] = [...pointers.values()];
    return {
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      angle: Math.atan2(b.y - a.y, b.x - a.x)
    };
  }

  function angularDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function rememberFreeVelocity(dt) {
    motionDelta.copy(rotationBefore).invert().premultiply(freeRotation).normalize();
    if (motionDelta.w < 0) motionDelta.set(-motionDelta.x, -motionDelta.y, -motionDelta.z, -motionDelta.w);
    const angle = 2 * Math.acos(Math.max(-1, Math.min(1, motionDelta.w)));
    const sine = Math.sqrt(Math.max(0, 1 - motionDelta.w * motionDelta.w));
    if (sine < .00001 || angle < .00001) motionAxis.set(0, 0, 0);
    else motionAxis.set(motionDelta.x, motionDelta.y, motionDelta.z).multiplyScalar(Math.min(8, angle / dt) / sine);
    angularVelocity.lerp(motionAxis, .65);
  }

  function rotateFreely(dx, dy) {
    deltaRotation.setFromEuler(deltaEuler.set(dy * .012, dx * .012, 0));
    freeRotation.premultiply(deltaRotation).normalize();
  }

  function trackballVector(x, y, target) {
    const bounds = dragBounds || surface.getBoundingClientRect();
    const radius = Math.max(1, bounds.width / 2);
    const px = (x - bounds.left - bounds.width / 2) / radius;
    const py = (bounds.top + bounds.height / 2 - y) / radius;
    const distanceSquared = px * px + py * py;
    // Continue smoothly outside the sphere so dragging past the rim cannot get stuck.
    const z = distanceSquared <= .5 ? Math.sqrt(1 - distanceSquared) : .5 / Math.sqrt(distanceSquared);
    return target.set(px, py, z).normalize();
  }

  function rotateAroundCenter(fromX, fromY, toX, toY) {
    trackballVector(fromX, fromY, trackballFrom);
    trackballVector(toX, toY, trackballTo);
    deltaRotation.setFromUnitVectors(trackballFrom, trackballTo);
    freeRotation.premultiply(deltaRotation).normalize();
  }

  function pointerDown(event) {
    if (!mode || pointers.size >= 2 || pointers.has(event.pointerId) || event.button !== 0) return;
    resumeDisplayedRotation();
    if (pointers.size === 0) dragBounds = surface.getBoundingClientRect();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture = pairGesture();
    lastInputTime = event.timeStamp ?? performance.now();
    lastMoveTime = -Infinity;
    stopMomentum();
    surface.setPointerCapture(event.pointerId);
    surface.focus({ preventScroll: true });
    updatePointerState();
    event.preventDefault();
    wake();
  }

  function flushGesture() {
    if (pendingGestureTime === null || pointers.size !== 2 || !gesture || !mode) return;
    const next = pairGesture();
    const dt = Math.max(1 / 240, Math.min(.1, (pendingGestureTime - lastInputTime) / 1000));
    lastInputTime = pendingGestureTime;
    pendingGestureTime = null;
    const spinDelta = -angularDelta(gesture.angle, next.angle);
    if (mode === 'flat') {
      flatSpin = (flatSpin + spinDelta) % (2 * Math.PI);
      spinVelocity = Math.max(-10, Math.min(10, spinDelta / dt));
      if (Math.abs(spinDelta) > .001) onRotate(spinDelta);
    } else {
      rotationBefore.copy(freeRotation);
      rotateAroundCenter(gesture.x, gesture.y, next.x, next.y);
      deltaRotation.setFromAxisAngle(viewAxis, spinDelta);
      freeRotation.premultiply(deltaRotation).normalize();
      rememberFreeVelocity(dt);
    }
    gesture = next;
  }

  function pointerMove(event) {
    const previous = pointers.get(event.pointerId);
    if (!mode || !previous) return;
    const time = event.timeStamp ?? performance.now();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    lastMoveTime = time;
    if (pointers.size === 2) {
      // Apply both touch positions together once per frame; a pinch alone is ignored.
      pendingGestureTime = time;
      event.preventDefault();
      wake();
      return;
    }
    const dt = Math.max(1 / 240, Math.min(.1, (time - lastInputTime) / 1000));
    lastInputTime = time;
    rotationBefore.copy(freeRotation);
    let spinDelta = 0;

    if (mode === 'flat') {
      const bounds = dragBounds || surface.getBoundingClientRect();
      const cx = bounds.left + bounds.width / 2;
      const cy = bounds.top + bounds.height / 2;
      if (Math.hypot(previous.x - cx, previous.y - cy) > 12 && Math.hypot(event.clientX - cx, event.clientY - cy) > 12) {
        spinDelta = -angularDelta(Math.atan2(previous.y - cy, previous.x - cx), Math.atan2(event.clientY - cy, event.clientX - cx));
      }
    } else rotateAroundCenter(previous.x, previous.y, event.clientX, event.clientY);

    if (mode === 'flat') {
      flatSpin = (flatSpin + spinDelta) % (2 * Math.PI);
      spinVelocity = Math.max(-10, Math.min(10, spinDelta / dt));
      if (Math.abs(spinDelta) > .001) onRotate(spinDelta);
    } else rememberFreeVelocity(dt);
    event.preventDefault();
    wake();
  }

  function pointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    flushGesture();
    pointers.delete(event.pointerId);
    gesture = pairGesture();
    if (pointers.size === 0) dragBounds = null;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    if ((event.timeStamp ?? performance.now()) - lastMoveTime > 100) stopMomentum();
    lastInputTime = event.timeStamp ?? performance.now();
    updatePointerState();
    wake();
  }

  function pointerCancel(event) {
    if (pointers.has(event.pointerId)) { releaseAllPointers(); wake(); }
  }

  function keyDown(event) {
    if (!mode) return;
    resumeDisplayedRotation();
    rotationBefore.copy(freeRotation);
    if (event.key === 'Home') {
      timedReturn = null;
      resetTransition = null;
      onReset();
      if (mode === 'flat') flatSpin = 0;
      else freeRotation.identity();
      stopMomentum();
    } else if (mode === 'flat' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? 1 : -1;
      flatSpin = (flatSpin + direction * Math.PI / 12) % (2 * Math.PI);
      spinVelocity = direction * 2.5;
      onRotate(direction * Math.PI / 12);
    } else if (mode === 'free' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      const dx = event.key === 'ArrowLeft' ? -15 : ['ArrowRight', 'Enter', ' '].includes(event.key) ? 15 : 0;
      const dy = event.key === 'ArrowUp' ? -15 : event.key === 'ArrowDown' ? 15 : 0;
      rotateFreely(dx, dy);
      rememberFreeVelocity(.06);
    } else return;
    event.preventDefault();
    wake();
  }

  surface.addEventListener('pointerdown', pointerDown);
  surface.addEventListener('pointermove', pointerMove);
  surface.addEventListener('pointerup', pointerUp);
  surface.addEventListener('pointercancel', pointerCancel);
  surface.addEventListener('lostpointercapture', pointerCancel);
  surface.addEventListener('keydown', keyDown);

  return {
    returnToDefault,
    update(disc, dt = 0, motionEnabled = true) {
      const progress = getProgress();
      const direction = previousProgress === null ? 0 : Math.sign(progress - previousProgress);
      const nextMode = !disc?.visible ? null : kind === 'voyager' ? (progress >= .70 ? 'free' : null)
        : progress < .17 ? 'free' : progress >= .38 && progress <= .55 ? 'flat' : null;
      if (resetTransition && direction && direction !== Math.sign(resetTransition.target - resetTransition.start)) {
        // Reverse from the currently displayed pose; do not restore an earlier interaction.
        beginReset(resetDestination(previousProgress ?? progress, direction), progress);
      }
      if (nextMode !== mode) {
        if (mode && !timedReturn) beginReset(kind === 'voyager' ? .59
          : previousProgress < .17 ? .38 : (direction < 0 ? .17 : .70), progress);
        releaseAllPointers();
        mode = nextMode;
        surface.dataset.mode = mode || 'disabled';
        const label = kind === 'voyager'
          ? 'Rotate Voyager 360 degrees around the center of its dish. Drag with one or two fingers, or twist with two fingers. Arrow keys rotate, Home resets.'
          : mode === 'flat'
          ? 'Spin disc in either direction. Twist with two fingers to spin. Arrow keys rotate, Home resets.'
          : 'Rotate disc 360 degrees around its center. Drag with one or two fingers, or twist with two fingers. Arrow keys rotate, Home resets.';
        surface.setAttribute('aria-label', label);
        surface.title = mode === 'flat' ? 'Drag or twist with two fingers to spin' : 'Drag with one or two fingers · Twist to rotate';
      }
      surface.hidden = !mode;
      surface.disabled = !mode;
      if (!disc) { previousProgress = progress; return false; }
      baseRotation.copy(disc.quaternion);
      pivotOffset.copy(pivot).multiply(disc.scale).applyQuaternion(baseRotation);
      pivotAnchor.copy(disc.position).add(pivotOffset);
      flushGesture();

      if (!motionEnabled) stopMomentum();
      if (mode && pointers.size === 0 && motionEnabled && dt > 0) {
        // Integrate exponential drag so momentum behaves consistently across refresh rates.
        const decay = Math.exp(-3.8 * dt);
        const travel = (1 - decay) / 3.8;
        if (mode === 'flat') {
          const spinDelta = spinVelocity * travel;
          flatSpin = (flatSpin + spinDelta) % (2 * Math.PI);
          onRotate(spinDelta, true);
        }
        else {
          const speed = angularVelocity.length();
          if (speed > .008) {
            motionAxis.copy(angularVelocity).multiplyScalar(1 / speed);
            deltaRotation.setFromAxisAngle(motionAxis, speed * travel);
            freeRotation.premultiply(deltaRotation).normalize();
          }
        }
        spinVelocity *= decay;
        angularVelocity.multiplyScalar(decay);
        if (Math.abs(spinVelocity) < .008) spinVelocity = 0;
        if (angularVelocity.length() < .008) angularVelocity.set(0, 0, 0);
      }

      // Fade the last interaction offset into the destination's default scroll pose.
      if (resetTransition) {
        const distance = resetTransition.target - resetTransition.start;
        const amount = distance === 0 ? 1 : clampInteraction((progress - resetTransition.start) / distance);
        const remaining = 1 - smoothInteraction(amount);
        blendedRotation.copy(identity).slerp(resetTransition.rotation, remaining);
        disc.quaternion.premultiply(blendedRotation);
        if (amount >= 1) resetTransition = null;
      }
      if (timedReturn) {
        timedReturn.elapsed += motionEnabled ? dt : timedReturn.duration;
        const amount = Math.min(1, timedReturn.elapsed / timedReturn.duration);
        if (timedReturn.flatAngle !== null) blendedRotation.setFromAxisAngle(viewAxis, timedReturn.flatAngle * (1 - smoothInteraction(amount)));
        else blendedRotation.copy(timedReturn.rotation).slerp(identity, smoothInteraction(amount));
        disc.quaternion.premultiply(blendedRotation);
        if (amount >= 1) timedReturn = null;
      }
      if (mode === 'flat') {
        // Spin around the viewer's axis, including when the back face is showing.
        deltaRotation.setFromAxisAngle(viewAxis, flatSpin);
        disc.quaternion.premultiply(deltaRotation);
      }
      else if (mode === 'free') disc.quaternion.premultiply(freeRotation);
      pivotOffset.copy(pivot).multiply(disc.scale).applyQuaternion(disc.quaternion);
      disc.position.copy(pivotAnchor).sub(pivotOffset);
      previousBaseRotation.copy(baseRotation);
      previousRenderedRotation.copy(disc.quaternion);
      previousProgress = progress;
      hasPreviousPose = true;
      const momentum = Boolean(mode && pointers.size === 0 && motionEnabled && (spinVelocity || angularVelocity.lengthSq()));
      const moving = momentum || Boolean(timedReturn);
      surface.dataset.momentum = String(momentum);
      surface.dataset.resetting = String(Boolean(resetTransition || timedReturn));
      if (!mode) return moving;

      camera.updateMatrixWorld();
      disc.updateWorldMatrix(true, false);
      center.copy(pivot).applyMatrix4(disc.matrixWorld);
      surface.dataset.pivot = center.toArray().map(value => value.toFixed(5)).join(',');
      edge.copy(center).addScaledVector(camera.up, getRadius() * disc.scale.x);
      center.project(camera);
      edge.project(camera);
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      const radius = Math.max(kind === 'voyager' ? 24 : 0, Math.abs(edge.y - center.y) * height / 2);
      surface.style.left = `${(center.x + 1) * width / 2 - radius}px`;
      surface.style.top = `${(1 - center.y) * height / 2 - radius}px`;
      surface.style.width = surface.style.height = `${radius * 2}px`;
      return moving;
    },
    dispose() {
      releaseAllPointers();
      surface.removeEventListener('pointerdown', pointerDown);
      surface.removeEventListener('pointermove', pointerMove);
      surface.removeEventListener('pointerup', pointerUp);
      surface.removeEventListener('pointercancel', pointerCancel);
      surface.removeEventListener('lostpointercapture', pointerCancel);
      surface.removeEventListener('keydown', keyDown);
      surface.remove();
    }
  };
}

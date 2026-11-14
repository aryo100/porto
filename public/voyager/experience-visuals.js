const clamp = value => Math.max(0, Math.min(1, value));

export const getTimelineZoom = progress => clamp(progress) * 4;
export const getTimelineRotation = (progress, enabled = true) => enabled ? clamp(progress) * Math.PI * 1.35 : 0;

export function advanceTimelineScroll(position, target, dt) {
  const distance = target - position;
  return Math.abs(distance) <= 2 ? target : position + distance * (1 - Math.exp(-Math.max(0, Math.min(.05, dt)) * 17));
}

export function sampleDialRings(phase, size) {
  const loop = ((phase % 1) + 1) % 1;
  return Array.from({ length: 20 }, (_, index) => {
    const radius = size * .1 * Math.pow(1.38, index - 9 + loop);
    const inner = clamp((radius - 2) / 14), outer = clamp((size * .85 - radius) / (size * .2));
    return { radius, opacity: inner * outer, rotation: (index + loop) * .024 };
  });
}

const palettes = [
  { primary: [148, 93, 40], secondary: [49, 68, 85], base: [11, 16, 14] },
  { primary: [110, 99, 64], secondary: [75, 57, 77], base: [13, 17, 18] },
  { primary: [105, 58, 76], secondary: [148, 82, 40], base: [18, 13, 17] },
  { primary: [167, 123, 61], secondary: [51, 73, 77], base: [18, 17, 12] }
];

export function sampleExperienceColors(progress) {
  const position = clamp(progress) * (palettes.length - 1), index = Math.floor(position);
  const a = palettes[index], b = palettes[Math.min(index + 1, palettes.length - 1)], t = position - index;
  return Object.fromEntries(['primary', 'secondary', 'base'].map(key => [key,
    a[key].map((value, i) => Math.round(value + (b[key][i] - value) * t))]));
}

export function sampleTimelineRail(first, last, anchor) {
  const head = Math.max(first, Math.min(last, anchor));
  return { head, fill: head - first, progress: clamp((head - first) / Math.max(1, last - first)) };
}

export function createEndSparkGate(random = Math.random) {
  let topArmed = true, bottomArmed = true;
  const count = () => 1 + Math.min(4, Math.floor(random() * 5));
  return {
    sample(progress, enabled = true) {
      if (!enabled) { topArmed = progress > .06; bottomArmed = progress < .94; return 0; }
      if (progress > .06) topArmed = true;
      if (progress < .94) bottomArmed = true;
      if (progress <= .005 && topArmed) { topArmed = false; return count(); }
      if (progress >= .995 && bottomArmed) { bottomArmed = false; return count(); }
      return 0;
    }
  };
}

export function sampleSparkBurst(count, direction, compact, random = Math.random) {
  const largest = Math.min(count - 1, Math.floor(random() * count));
  return Array.from({ length: count }, (_, i) => {
    const lane = (i + .12 + random() * .76) / count;
    const angle = compact ? .36 + lane * .92 : (lane - .5) * 2.25;
    const distance = (compact ? 52 : 57) + random() * (compact ? 49 : 72);
    return { x: Math.sin(angle) * distance, y: Math.cos(angle) * distance * (direction < 0 ? -1 : 1),
      rotation: (random() - .5) * 100, scale: i === largest ? 1 : .43 + random() * .49, delay: i * 29 + random() * 44 };
  });
}

export function createScrollEnergy() {
  let previousPosition = null, previousTime = 0, velocity = 0, energy = 0, energizedAt = 0;
  const value = (time, enabled = true) => enabled ? energy * Math.exp(-Math.max(0, time - energizedAt) / 190) : 0;
  return {
    value,
    sample(position, time) {
      if (previousPosition !== null && time > previousTime && position !== previousPosition) {
        const dt = Math.max(.008, Math.min(.05, (time - previousTime) / 1000));
        if (time - previousTime > 180) velocity = 0;
        const nextVelocity = (position - previousPosition) / dt;
        const acceleration = Math.abs(nextVelocity - velocity) / dt;
        energy = Math.max(value(time), 1 - Math.exp(-acceleration / 65000));
        energizedAt = time; velocity = nextVelocity;
      }
      previousPosition = position; previousTime = time;
      return value(time);
    }
  };
}

export function createTimelineBoundaryState() {
  let heldDirection = 0, heldTarget = null, lastTime = -Infinity;
  return {
    reset() { heldDirection = 0; heldTarget = null; lastTime = -Infinity; },
    sample({ first, last, position, delta, time, fresh = false, continuation = false, settled = true }) {
      const newGesture = fresh || (!continuation && time - lastTime > 240);
      if (newGesture && settled) heldDirection = 0;
      if (continuation !== 'scroll') lastTime = time;
      const direction = Math.sign(delta);
      if (heldDirection && (direction === heldDirection || continuation === 'scroll')) return { blocked: true, target: heldTarget };
      if (direction !== heldDirection) heldDirection = 0;
      const next = position + delta;
      // Pass the entry edge freely. Only hold the endpoint in the current travel direction.
      const target = direction > 0 && next >= last && (position < last - .5 || (!newGesture && position <= last + .5)) ? last
        : direction < 0 && next <= first && (position > first + .5 || (!newGesture && position >= first - .5)) ? first : null;
      if (target === null) return { blocked: false, target: null };
      heldDirection = direction; heldTarget = target;
      return { blocked: true, target };
    }
  };
}

function transitionSymbol() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 54');
  const add = (tag, attributes) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    svg.append(node);
  };
  for (const cx of [24, 76]) {
    add('circle', { cx, cy: 29, r: 20, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 });
    add('circle', { cx, cy: 29, r: 1.8, fill: 'currentColor' });
  }
  add('path', { d: 'M44 29H56M24 2V16M21 6L24 2L27 6M76 2V16M73 12L76 16L79 12M24 34V41M76 34V41',
    fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return svg;
}

export function createExperienceVisuals({ section, clock, line, list, isPaused }) {
  const dial = clock.querySelector('.experience-dial');
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'experience-zoom'; dial.classList.add('is-animated'); dial.append(canvas);
  const context = canvas.getContext('2d');
  const atmosphere = document.createElement('div'); atmosphere.className = 'experience-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div'); stage.className = 'experience-atmosphere-stage';
  atmosphere.append(stage); section.prepend(atmosphere);
  const overlay = document.createElement('div'); overlay.className = 'experience-rail-motion'; overlay.setAttribute('aria-hidden', 'true');
  const rail = document.createElement('i'); rail.className = 'experience-rail-base';
  const fill = document.createElement('i'); fill.className = 'experience-rail-fill';
  const head = document.createElement('span'); head.className = 'experience-traveler';
  overlay.append(rail, fill, head); line.append(overlay);
  const gate = createEndSparkGate(), scrollEnergy = createScrollEnergy();
  const ticks = Array.from({ length: 36 }, (_, index) => {
    const angle = index / 36 * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle), major: index % 3 === 0 };
  });
  const items = [...section.querySelectorAll('.experience-item')];
  let progress = 0, raf = 0, visible = false, stopped = false, dirty = true, prepared = false;
  let lastPaused = isPaused();
  let size = 1, width = 1, height = 1, ratio = 1, burstCount = 0, sparksTimer = 0, drawCount = 0;
  let layout = { x: 0, start: 0, length: 1, pageTop: 0, viewportLeft: 0 };
  let lastRail = { progress: 0, x: 0, y: 0, met: false };
  let lastScrollY = scrollY, scrollDirection = 0;
  const sparks = [];
  section.dataset.uraniumBurstCount = '0'; section.dataset.uraniumSparksActive = '0';

  function draw(phaseOverride) {
    if (!context) return;
    const sampledPhase = phaseOverride ?? (isPaused() ? 0 : getTimelineZoom(progress));
    const rotation = getTimelineRotation(phaseOverride === undefined ? progress : phaseOverride, !isPaused());
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height);
    context.save(); context.translate(width * .5, height * .54); context.rotate(rotation);
    for (const ring of sampleDialRings(sampledPhase, size)) {
      if (ring.opacity < .001 || ring.radius < 3) continue;
      const r = ring.radius, rotation = ring.rotation + (isPaused() ? 0 : progress * .12);
      context.save(); context.rotate(rotation);
      context.strokeStyle = `rgba(197,164,107,${ring.opacity * .25})`; context.lineWidth = .7;
      context.beginPath(); context.arc(0, 0, r, 0, Math.PI * 2); context.stroke();
      for (const major of [false, true]) {
        context.strokeStyle = `rgba(233,229,217,${ring.opacity * (major ? .3 : .13)})`;
        const length = major ? Math.min(12, r * .12) : Math.min(4, r * .07);
        context.beginPath();
        for (const tick of ticks) {
          if (tick.major !== major) continue;
          context.moveTo(tick.x * r, tick.y * r);
          context.lineTo(tick.x * (r - length), tick.y * (r - length));
        }
        context.stroke();
      }
      context.restore();
    }
    context.strokeStyle = 'rgba(197,164,107,.08)'; context.lineWidth = .6;
    context.beginPath(); context.moveTo(-width * .44, 0); context.lineTo(width * .44, 0);
    context.moveTo(0, -height * .44); context.lineTo(0, height * .44); context.stroke(); context.restore();
    section.dataset.dialPhase = sampledPhase.toFixed(4);
    section.dataset.dialRotation = rotation.toFixed(4);
    section.dataset.dialDrawCount = String(++drawCount); dirty = false;
  }
  function paintAtmosphere() {
    const zoom = isPaused() ? 0 : getTimelineZoom(progress);
    stage.style.transform = isPaused() ? 'none'
      : `translate3d(${Math.sin(zoom * .7) * 16}px,${Math.cos(zoom * .55) * 10}px,0) scale(1.04)`;
  }
  function paintEnergy(time) {
    let value = scrollEnergy.value(time, !isPaused());
    if (value < .005) value = 0;
    head.style.setProperty('--scroll-energy', value.toFixed(3)); section.dataset.nodeEnergy = value.toFixed(3);
    return value;
  }
  function frame(time) {
    raf = 0;
    if (stopped || !visible || document.hidden) return;
    if (dirty) { draw(); paintAtmosphere(); }
    trySparks();
    if (paintEnergy(time) > 0 && !isPaused()) raf = requestAnimationFrame(frame);
  }
  function clearSparks() {
    clearTimeout(sparksTimer); sparks.splice(0).forEach(node => node.remove());
    section.dataset.uraniumSparksActive = '0';
  }
  function sync() {
    if (lastPaused !== isPaused()) { dirty = true; lastPaused = isPaused(); }
    if (isPaused()) { clearSparks(); dirty = true; }
    if (!visible || document.hidden) { cancelAnimationFrame(raf); raf = 0; return; }
    if (!raf && !stopped) raf = requestAnimationFrame(frame);
  }
  function resize() {
    const nextWidth = Math.max(1, dial.clientWidth), nextHeight = Math.max(1, dial.clientHeight);
    const nextRatio = Math.min(devicePixelRatio || 1, 1.25);
    if (nextWidth === width && nextHeight === height && nextRatio === ratio && canvas.width > 1) return;
    width = nextWidth; height = nextHeight; size = Math.min(width, height); ratio = nextRatio;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); dirty = true;
    if (prepared) sync(); else draw();
  }
  function emitSparks(x, y, count, direction) {
    clearSparks();
    const compactEdge = layout.viewportLeft + x < 95;
    for (const motion of sampleSparkBurst(count, direction, compactEdge)) {
      const spark = document.createElement('span'); spark.className = 'experience-isotope'; spark.dataset.symbol = 'golden-record-transition';
      spark.style.left = `${x}px`; spark.style.top = `${y}px`;
      spark.style.setProperty('--spark-x', `${motion.x}px`); spark.style.setProperty('--spark-y', `${motion.y}px`);
      spark.style.setProperty('--spark-rotation', `${motion.rotation}deg`); spark.style.setProperty('--spark-size', motion.scale);
      spark.style.animationDelay = `${motion.delay}ms`;
      spark.append(transitionSymbol()); overlay.append(spark); sparks.push(spark);
    }
    section.dataset.uraniumBurstCount = String(++burstCount); section.dataset.uraniumSparksActive = String(count);
    sparksTimer = setTimeout(clearSparks, 1350);
  }
  function trySparks() {
    if (isPaused()) { gate.sample(lastRail.progress, false); return; }
    if (!visible || document.hidden || document.body.classList.contains('is-loading')) return;
    if (!lastRail.met && (lastRail.progress <= .005 || lastRail.progress >= .995)) return;
    const count = gate.sample(lastRail.progress, true);
    if (count) emitSparks(lastRail.x, lastRail.y, count, scrollDirection || (lastRail.progress < .5 ? -1 : 1));
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '100px' });
  observer.observe(section);
  const resizer = new ResizeObserver(resize); resizer.observe(dial);
  document.addEventListener('visibilitychange', sync); resize();
  return {
    measure(nextLayout) {
      layout = nextLayout;
      rail.style.cssText = `left:${layout.x}px;top:${layout.start}px;height:${layout.length}px`;
      fill.style.cssText = `left:${layout.x}px;top:${layout.start}px;height:${layout.length}px;transform-origin:top`;
      head.style.left = `${layout.x}px`;
    },
    update({ positions, anchor, progress: nextProgress }) {
      if (Math.abs(scrollY - lastScrollY) > .25) scrollDirection = Math.sign(scrollY - lastScrollY);
      lastScrollY = scrollY;
      dirty ||= progress !== nextProgress;
      progress = nextProgress; scrollEnergy.sample(scrollY, performance.now());
      const colors = sampleExperienceColors(progress);
      // These colors affect only the compact sticky clock; the large washes are prepainted layers.
      section.style.setProperty('--experience-a', colors.primary.join(' '));
      section.style.setProperty('--experience-b', colors.secondary.join(' '));
      section.style.setProperty('--experience-base', colors.base.join(' '));
      const state = sampleTimelineRail(positions[0], positions.at(-1), anchor);
      const y = state.head - (layout.pageTop - scrollY);
      fill.style.transform = `scaleY(${state.progress})`; head.style.top = `${y}px`;
      section.dataset.railProgress = state.progress.toFixed(4);
      items.forEach((item, index) => item.classList.toggle('is-past', positions[index] <= anchor + 1));
      lastRail = { progress: state.progress, x: layout.x, y, met: Math.abs(state.head - anchor) < 3 };
      trySparks(); sync();
    },
    async prepare() {
      resize();
      prepared = true; dirty = true; draw(); paintAtmosphere();
      section.dataset.uiPrepared = 'true';
    },
    dispose() {
      stopped = true; cancelAnimationFrame(raf); clearSparks(); observer.disconnect(); resizer.disconnect();
      document.removeEventListener('visibilitychange', sync); canvas.remove(); overlay.remove(); atmosphere.remove();
    }
  };
}

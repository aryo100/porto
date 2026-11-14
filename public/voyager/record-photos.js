const limit = (value, min, max) => Math.max(min, Math.min(max, value));

export function selectRecordPhotos(images) {
  if (!images.length) return [];
  const originals = images.filter(image => image.src !== '/assets/image.jpg');
  const personal = images.find(image => image.src === '/assets/image.jpg');
  const selected = originals.filter(image => image.selected).sort((a, b) => a.order - b.order);
  return [...(selected.length ? selected : originals).slice(0, 9), ...(personal ? [personal] : [])];
}

export function sampleGoldenRecordCard(position, index) {
  const t = limit(position - index, 0, 1);
  const entry = 1 - Math.pow(1 - t, 3);
  const age = Math.max(0, position - index - 1);
  const fade = limit((age - 9) / 2, 0, 1);
  return { entry, depth: Math.max(.8, 1 - age * .025),
    opacity: entry * (1 - fade * fade * (3 - 2 * fade)), age };
}

export function getPortraitLayout(crop) {
  const [x, y, width, height] = crop.content;
  const creditWidth = crop.credit?.[2] || 0;
  const gutter = creditWidth ? creditWidth + 6 : 0;
  return { width: width + gutter, height,
    photo: { x: gutter, y: 0, width, height, source: [x, y, width, height] },
    credit: crop.credit ? { x: 0, y: 0, width: creditWidth, height, source: crop.credit } : null };
}

export function rotatePhotoAround(body, delta, pivot) {
  const dx = body.x - pivot.x, dy = body.y - pivot.y;
  const cos = Math.cos(delta), sin = Math.sin(delta);
  body.x = pivot.x + dx * cos - dy * sin;
  body.y = pivot.y + dx * sin + dy * cos;
  body.angle = (body.angle || 0) + delta;
  body.pivotX = pivot.x; body.pivotY = pivot.y;
}

export function createPhotoGesture(body) {
  const pointers = new Map();
  let baseline = new Map(), local = { x: 0, y: 0 }, baseAngle = 0;
  let rotateMode = false, mousePivot = null, mouseStart = null;
  function rebase() {
    if (!pointers.size) return;
    const anchor = pointers.values().next().value;
    const angle = body.angle || 0, cos = Math.cos(angle), sin = Math.sin(angle);
    const dx = anchor.x - body.x, dy = anchor.y - body.y;
    local = { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
    baseAngle = angle;
    baseline = new Map([...pointers].map(([id, point]) => [id, { ...point }]));
    body.pivotX = anchor.x; body.pivotY = anchor.y;
  }
  return {
    pointers,
    down(id, point, options = {}) {
      if (pointers.has(id)) return;
      if (!pointers.size) {
        rotateMode = Boolean(options.rotate); mousePivot = { ...point }; mouseStart = { ...point };
        body.vx = body.vy = body.angularVelocity = 0;
      }
      pointers.set(id, { ...point });
      body.dragging = body.dynamic = body.userDriven = true;
      rebase();
    },
    move(id, point, dt = 1 / 60) {
      if (!pointers.has(id)) return false;
      dt = Math.max(.008, dt);
      const previousPoint = pointers.get(id), oldAngle = body.angle || 0;
      const previousPivot = { x: body.pivotX, y: body.pivotY };
      pointers.set(id, { ...point });
      let pivot = pointers.values().next().value, angle = oldAngle;
      if (pointers.size > 1) {
        const oldAnchor = baseline.values().next().value;
        let dot = 0, cross = 0;
        for (const [key, current] of pointers) {
          const old = baseline.get(key);
          const ax = old.x - oldAnchor.x, ay = old.y - oldAnchor.y;
          const bx = current.x - pivot.x, by = current.y - pivot.y;
          dot += ax * bx + ay * by; cross += ax * by - ay * bx;
        }
        const raw = baseAngle + Math.atan2(cross, dot);
        angle = oldAngle + Math.atan2(Math.sin(raw - oldAngle), Math.cos(raw - oldAngle));
      } else if (rotateMode) {
        pivot = mousePivot;
        angle = baseAngle + (point.x - mouseStart.x - point.y + mouseStart.y) / 140;
      } else {
        const dx = point.x - previousPoint.x, dy = point.y - previousPoint.y;
        const inertia = Math.max(1600, (body.width * body.width + body.height * body.height) / 12);
        angle += (local.x * dy - local.y * dx) / inertia * .18;
      }
      const cos = Math.cos(angle), sin = Math.sin(angle);
      body.x = pivot.x - (local.x * cos - local.y * sin);
      body.y = pivot.y - (local.x * sin + local.y * cos);
      body.angle = angle; body.pivotX = pivot.x; body.pivotY = pivot.y;
      body.vx = limit((pivot.x - previousPivot.x) / dt, -1500, 1500);
      body.vy = limit((pivot.y - previousPivot.y) / dt, -1500, 1500);
      body.angularVelocity = limit((angle - oldAngle) / dt, -8, 8);
      body.userDriven = true;
      return true;
    },
    up(id) {
      pointers.delete(id); body.dragging = pointers.size > 0;
      if (pointers.size) { rotateMode = false; rebase(); }
    },
    rotate(delta) {
      rotatePhotoAround(body, delta, { x: body.pivotX ?? body.x, y: body.pivotY ?? body.y });
      body.dynamic = body.userDriven = true; body.angularVelocity = delta * 6;
    },
    cancel() {
      pointers.clear(); body.dragging = body.userDriven = false;
      body.vx = body.vy = body.angularVelocity = 0;
    }
  };
}

function papersOverlap(a, b) {
  for (const angle of [a.angle || 0, (a.angle || 0) + Math.PI / 2, b.angle || 0, (b.angle || 0) + Math.PI / 2]) {
    const x = Math.cos(angle), y = Math.sin(angle);
    const radius = paper => {
      const cos = Math.cos(paper.angle || 0), sin = Math.sin(paper.angle || 0);
      return Math.abs(x * cos + y * sin) * paper.width / 2 + Math.abs(-x * sin + y * cos) * paper.height / 2;
    };
    if (Math.abs((b.x - a.x) * x + (b.y - a.y) * y) >= radius(a) + radius(b)) return false;
  }
  return true;
}

export function getDirectPhotoContacts(bodies, hand) {
  const layer = paper => paper.layer ?? bodies.indexOf(paper);
  let below = null, above = null;
  for (const paper of bodies) {
    if (paper === hand || !paper.active || !papersOverlap(hand, paper)) continue;
    if (layer(paper) < layer(hand) && (!below || layer(paper) > layer(below))) below = paper;
    if (layer(paper) > layer(hand) && (!above || layer(paper) < layer(above))) above = paper;
  }
  return [below, above].filter(Boolean);
}

export function stepPhotoBodies(bodies, dt, bounds, motionEnabled = true) {
  dt = limit(dt, 0, .05);
  const decay = Math.exp(-5 * dt), travel = (1 - decay) / 5;
  let contacts = 0;
  for (const body of bodies) {
    if (!body.active || !body.dynamic) continue;
    body.angle ||= 0; body.angularVelocity ||= 0;
    if (!motionEnabled && !body.dragging) body.vx = body.vy = body.angularVelocity = 0;
    if (!body.dragging) {
      const dx = body.vx * travel, dy = body.vy * travel;
      const pivot = { x: (body.pivotX ?? body.x) + dx, y: (body.pivotY ?? body.y) + dy };
      body.x += dx; body.y += dy;
      rotatePhotoAround(body, body.angularVelocity * travel, pivot);
      body.vx *= decay; body.vy *= decay; body.angularVelocity *= decay;
      body.tiltX *= decay; body.tiltY *= decay;
      if (Math.abs(body.vx) < 1) body.vx = 0;
      if (Math.abs(body.vy) < 1) body.vy = 0;
      if (Math.abs(body.angularVelocity) < .004) body.angularVelocity = 0;
      if (!body.vx && !body.vy && !body.angularVelocity) body.userDriven = false;
    }
  }
  const handled = new Set();
  for (const hand of bodies) {
    if (!hand.active || (!hand.dragging && !hand.userDriven)) continue;
    const spin = hand.angularVelocity || 0;
    if (Math.hypot(hand.vx, hand.vy) + Math.abs(spin) * Math.min(hand.width, hand.height) < 1) continue;
    for (const sheet of getDirectPhotoContacts(bodies, hand)) {
      if (sheet.dragging) continue;
      const pair = [bodies.indexOf(hand), bodies.indexOf(sheet)].sort((a, b) => a - b).join(':');
      if (handled.has(pair)) continue;
      handled.add(pair);
      const grip = (1 - Math.exp(-12 * dt)) * .12;
      const vx = limit(hand.vx - spin * (sheet.y - (hand.pivotY ?? hand.y)), -1500, 1500);
      const vy = limit(hand.vy + spin * (sheet.x - (hand.pivotX ?? hand.x)), -1500, 1500);
      if (hand.dragging) {
        const dx = limit(vx * dt * grip, -2, 2), dy = limit(vy * dt * grip, -2, 2);
        sheet.x += dx; sheet.y += dy;
        if (sheet.pivotX !== undefined) sheet.pivotX += dx;
        if (sheet.pivotY !== undefined) sheet.pivotY += dy;
      }
      if (motionEnabled) {
        sheet.vx += (vx - sheet.vx) * grip;
        sheet.vy += (vy - sheet.vy) * grip;
        sheet.angularVelocity = (sheet.angularVelocity || 0) + spin * grip * .15;
      } else sheet.vx = sheet.vy = sheet.angularVelocity = 0;
      sheet.dynamic = true;
      contacts++;
    }
  }
  for (const body of bodies) {
    if (!body.active || !body.dynamic || body.dragging) continue;
    const cos = Math.abs(Math.cos(body.angle || 0)), sin = Math.abs(Math.sin(body.angle || 0));
    const halfX = (cos * body.width + sin * body.height) / 2;
    const halfY = (sin * body.width + cos * body.height) / 2;
    const minX = bounds.left + halfX, maxX = Math.max(minX, bounds.right - halfX);
    const minY = bounds.top + halfY, maxY = Math.max(minY, bounds.bottom - halfY);
    const x = limit(body.x, minX, maxX), y = limit(body.y, minY, maxY);
    if (x !== body.x) { if (body.pivotX !== undefined) body.pivotX += x - body.x; body.x = x; body.vx = 0; }
    if (y !== body.y) { if (body.pivotY !== undefined) body.pivotY += y - body.y; body.y = y; body.vy = 0; }
  }
  return contacts;
}

function paintPhoto(image, canvas, metadata, personal) {
  if (personal) {
    canvas.width = 360; canvas.height = Math.round(360 * image.naturalHeight / image.naturalWidth);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return;
  }
  const layout = getPortraitLayout(metadata.crop);
  canvas.width = layout.width; canvas.height = layout.height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#000'; context.fillRect(0, 0, canvas.width, canvas.height);
  for (const region of [layout.photo, layout.credit].filter(Boolean)) {
    context.drawImage(image, ...region.source, region.x, region.y, region.width, region.height);
  }
}

export function createRecordGallery({ viewport, mount, reveal, wake }) {
  const layer = document.createElement('div'); layer.className = 'memory-gallery';
  layer.setAttribute('role', 'group'); layer.setAttribute('aria-label', 'Golden Record photographs. Drag, throw, or use arrow keys to move cards.');
  viewport.append(layer);
  const controller = new AbortController(), signal = controller.signal;
  const initialTouchAction = viewport.style.touchAction;
  let cards = [], disposed = false, frontOrder = 30, origin = { x: 0, y: 0 }, active = false, revision = '', lastPosition = 0, gestureOwner = null;
  let renderedCardCount = -1;
  const pointFromEvent = event => {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left - origin.x, y: event.clientY - rect.top - origin.y };
  };
  const release = (card, cancel = false, pointerId = null) => {
    const pointers = pointerId === null ? [...card.gesture.pointers.keys()] : [pointerId];
    for (const pointer of pointers) {
      card.gesture.up(pointer);
      if (card.figure.hasPointerCapture(pointer)) card.figure.releasePointerCapture(pointer);
    }
    if (cancel && pointerId === null) card.gesture.cancel();
    if (cancel || performance.now() - card.lastMove > 100) card.body.vx = card.body.vy = card.body.angularVelocity = 0;
    card.figure.classList.toggle('is-dragging', card.gesture.pointers.size > 0);
    if (gestureOwner === card && !card.gesture.pointers.size) { gestureOwner = null; viewport.style.touchAction = initialTouchAction; }
  };
  const startPointer = (card, event) => {
    if (!active || !card.body.active || event.button !== 0 || card.gesture.pointers.has(event.pointerId)) return;
    event.preventDefault(); event.stopPropagation();
    if (!card.gesture.pointers.size) {
      card.figure.focus({ preventScroll: true });
      card.body.restScale = card.state.depth;
      card.body.layer = card.front = ++frontOrder;
    }
    if (card.personal) card.colorTap = card.gesture.pointers.size || event.shiftKey || event.altKey
      ? null : { id: event.pointerId, x: event.clientX, y: event.clientY };
    card.gesture.down(event.pointerId, pointFromEvent(event), { rotate: event.shiftKey || event.altKey });
    if (event.pointerType === 'touch' || event.pointerType === 'pen') viewport.style.touchAction = 'none';
    card.figure.setPointerCapture(event.pointerId);
    card.lastMove = performance.now(); gestureOwner = card;
    card.figure.classList.add('is-dragging'); wake();
  };
  // Additional fingers belong to the first held paper, even outside its current rectangle.
  viewport.addEventListener('pointerdown', event => {
    if (gestureOwner?.gesture.pointers.size && event.pointerType !== 'mouse' && !gestureOwner.gesture.pointers.has(event.pointerId)) startPointer(gestureOwner, event);
  }, { capture: true, signal });
  const createCard = (metadata, index) => {
    const personal = metadata.src === '/assets/image.jpg', portrait = Boolean(metadata.portrait) || personal;
    const figure = document.createElement('figure'); figure.className = 'memory-card'; figure.hidden = true;
    figure.classList.toggle('is-personal', personal); figure.classList.toggle('is-portrait', portrait);
    figure.dataset.source = metadata.src; figure.dataset.portrait = String(portrait);
    figure.setAttribute('role', 'button'); figure.tabIndex = 0;
    figure.setAttribute('aria-label', `Move photo: ${metadata.title}. Arrow keys move, Q and E rotate, Home resets.${personal ? ' Enter or Space toggles color.' : ''}`);
    const setColor = enabled => {
      figure.classList.toggle('is-color', enabled);
      figure.setAttribute('aria-pressed', String(enabled));
    };
    if (personal) setColor(false);
    figure.title = 'Drag to move · Shift-drag to rotate around your click · Twist with two or more fingers';
    const frame = document.createElement('div'); frame.className = 'memory-image';
    const photo = new Image(); photo.alt = metadata.alt || metadata.title; photo.decoding = 'async'; photo.draggable = false;
    let canvas;
    if (portrait) {
      canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); frame.append(canvas);
    } else frame.append(photo);
    const ready = new Promise((resolve, reject) => {
      photo.addEventListener('load', async () => {
        try {
          await photo.decode();
          if (disposed) return;
          if (canvas) { paintPhoto(photo, canvas, metadata, personal); figure.dataset.processed = 'true'; }
          figure.dataset.decoded = 'true'; resolve(); wake();
        } catch (error) { reject(error); }
      }, { signal });
      photo.addEventListener('error', () => reject(new Error(`Photo unavailable: ${metadata.title}`)), { signal });
    });
    photo.src = metadata.src;
    const caption = document.createElement('figcaption');
    const number = document.createElement('b'); number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span'); label.textContent = metadata.title;
    caption.append(number, label); figure.append(frame, caption); layer.append(figure);
    const defaultAngle = ((index % 5) - 2) * (portrait ? 1.5 : 2.2) * Math.PI / 180;
    const body = { x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, active: false, dynamic: false, dragging: false, userDriven: false, tiltX: 0, tiltY: 0, angle: defaultAngle, angularVelocity: 0, layer: index + 1, restScale: 1 };
    const card = { figure, photo, ready, personal, portrait, body, gesture: createPhotoGesture(body), defaultAngle, lastMove: 0, front: index + 1, wasVisible: false };
    figure.addEventListener('pointerdown', event => startPointer(card, event), { signal });
    figure.addEventListener('pointermove', event => {
      if (!card.gesture.pointers.has(event.pointerId)) return;
      if (card.colorTap && Math.hypot(event.clientX - card.colorTap.x, event.clientY - card.colorTap.y) > 6) card.colorTap = null;
      const now = performance.now();
      card.gesture.move(event.pointerId, pointFromEvent(event), (now - card.lastMove) / 1000);
      card.lastMove = now;
      event.preventDefault(); event.stopPropagation(); wake();
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) figure.addEventListener(type, event => {
      if (!card.gesture.pointers.has(event.pointerId)) return;
      const tap = card.colorTap;
      if (type === 'pointerup' && tap?.id === event.pointerId && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 6) {
        setColor(!figure.classList.contains('is-color'));
      }
      card.colorTap = null;
      release(card, type !== 'pointerup', event.pointerId); wake();
    }, { signal });
    figure.addEventListener('keydown', event => {
      if (!active) return;
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (personal && (event.key === 'Enter' || event.key === ' ')) {
        if (!event.repeat) setColor(!figure.classList.contains('is-color'));
      }
      else if (event.key === 'Home') {
        if (personal) setColor(false);
        release(card, true); body.dynamic = false; body.angle = defaultAngle; body.pivotX = body.pivotY = undefined;
      }
      else if (['q', 'Q', 'e', 'E'].includes(event.key)) { card.gesture.rotate((event.key.toLowerCase() === 'q' ? -1 : 1) * Math.PI / 12); body.layer = card.front = ++frontOrder; }
      else if (direction) {
        body.dynamic = body.userDriven = true; body.x += direction[0] * 24; body.y += direction[1] * 24;
        if (body.pivotX !== undefined) body.pivotX += direction[0] * 24;
        if (body.pivotY !== undefined) body.pivotY += direction[1] * 24;
        body.vx = direction[0] * 120; body.vy = direction[1] * 120; body.layer = card.front = ++frontOrder;
      } else return;
      event.preventDefault(); event.stopPropagation(); wake();
    }, { signal });
    if (personal) card.resetColor = () => { card.colorTap = null; setColor(false); };
    return card;
  };
  const ready = fetch('/assets/golden-record/manifest.json', { cache: 'no-store', signal })
    .then(response => { if (!response.ok) throw new Error('Gallery unavailable'); return response.json(); })
    .then(async manifest => {
      if (disposed) return;
      const portraitAvailable = await fetch('/assets/image.jpg', { method: 'HEAD', cache: 'no-store', signal })
        .then(response => response.ok).catch(() => false);
      const images = selectRecordPhotos(portraitAvailable ? manifest.images : manifest.images.filter(image => image.src !== '/assets/image.jpg'));
      cards = images.map(createCard);
      reveal.configureSequence(cards.length);
      mount.dataset.galleryStatus = 'loading-images';
      await Promise.all(cards.map(card => card.ready));
      mount.dataset.galleryStatus = 'ready'; mount.dataset.galleryTotal = String(cards.length); wake();
    }).catch(error => { if (!disposed) mount.dataset.galleryStatus = 'unavailable'; throw error; });
  // The scene awaits this promise together with its models; attach immediately for early failures.
  ready.catch(() => {});
  const timer = setInterval(async () => {
    if (document.hidden || disposed || !cards.at(-1)?.personal) return;
    try {
      const response = await fetch('/assets/image.jpg', { method: 'HEAD', cache: 'no-store', signal });
      const next = response.headers.get('ETag');
      if (response.ok && revision && next !== revision) cards.at(-1).photo.src = `/assets/image.jpg?v=${encodeURIComponent(next)}`;
      if (response.ok) revision = next;
    } catch { /* Keep the last decoded photo if a replacement is being written. */ }
  }, 2500);
  return {
    ready,
    isComplete(progress) { return cards.length > 0 && (progress === undefined ? lastPosition : reveal.sequencePosition(progress)) >= cards.length - .000001; },
    update(progress, nextOrigin, dt = 0, motionEnabled = true) {
      const position = reveal.sequencePosition(progress), nextActive = progress >= .38 && progress <= .55;
      const unchanged = !nextActive && !active && position === lastPosition && origin.x === nextOrigin.x && origin.y === nextOrigin.y
        && renderedCardCount === cards.length;
      origin = nextOrigin; active = nextActive; lastPosition = position;
      // Satellite interaction does not move the archive; keep its ten paper layers untouched.
      if (unchanged) return false;
      renderedCardCount = cards.length;
      const width = viewport.clientWidth, height = viewport.clientHeight, compact = width <= 700;
      const cardWidth = Math.min(compact ? 225 : 245, width * (compact ? .54 : .195));
      const centerX = width * (compact ? .045 : .06);
      const centerY = -Math.min(height * (compact ? .18 : .12), compact ? 155 : 85);
      const spread = width * (compact ? .055 : .032);
      const offsets = [[-1,-.7],[.85,-.55],[-.8,.75],[.95,.6],[-.1,-1],[.3,.9]];
      let visible = 0;
      for (const [index, card] of cards.entries()) {
        const { body, figure, portrait, personal } = card;
        const state = sampleGoldenRecordCard(position, index); card.state = state;
        figure.hidden = state.opacity < .001;
        if (figure.hidden) {
          if (card.wasVisible) card.resetColor?.();
          release(card, true); body.active = body.dynamic = false; body.vx = body.vy = body.tiltX = body.tiltY = 0;
          body.angle = card.defaultAngle; body.angularVelocity = 0; body.pivotX = body.pivotY = undefined; body.userDriven = false;
          card.wasVisible = false; continue;
        }
        visible++;
        const offset = offsets[index % offsets.length];
        const homeX = (centerX + offset[0] * spread) * state.entry;
        const homeY = (centerY + offset[1] * spread * .45 - Math.min(state.age, 6) * 4 + (personal ? 16 : 0)) * state.entry;
        if (!body.dynamic || !card.wasVisible) { body.x = homeX; body.y = homeY; }
        card.wasVisible = true;
        if (!body.dynamic) body.restScale = state.depth;
        card.scale = state.entry * body.restScale;
        card.width = cardWidth * (portrait ? .74 : 1);
        body.width = card.width * card.scale; body.height = body.width / (portrait ? .75 : 4 / 3);
        body.active = active && state.entry > .97;
        body.layer = card.front;
        if (body.dragging && performance.now() - card.lastMove > 90) body.vx = body.vy = body.angularVelocity = 0;
        if (!body.active) { release(card, true); body.vx = body.vy = 0; }
        figure.tabIndex = body.active ? 0 : -1;
        figure.style.pointerEvents = body.active ? 'auto' : 'none';
      }
      const contacts = active ? stepPhotoBodies(cards.map(card => card.body), dt, {
        left: 12 - origin.x, right: width - 12 - origin.x,
        top: (compact ? 85 : 105) - origin.y, bottom: height - 90 - origin.y
      }, motionEnabled) : 0;
      let moving = false;
      for (const [index, card] of cards.entries()) {
        if (card.figure.hidden) continue;
        const { figure, body, state } = card;
        const retract = body.dynamic ? state.entry : 1;
        const x = origin.x + body.x * retract, y = origin.y + body.y * retract;
        const tilt = body.angle * 180 / Math.PI * state.entry;
        figure.style.width = `${card.width}px`; figure.style.left = `${x}px`; figure.style.top = `${y}px`;
        figure.style.opacity = state.opacity.toFixed(4); figure.style.zIndex = String(card.front);
        figure.style.transform = `translate(-50%, -50%) perspective(850px) rotateX(0deg) rotateY(0deg) rotateZ(${tilt}deg) scale(${Math.max(.001, card.scale)})`;
        figure.dataset.dragging = String(body.dragging); figure.dataset.dynamic = String(body.dynamic);
        figure.dataset.angle = (body.angle * 180 / Math.PI).toFixed(3);
        figure.dataset.pointerCount = String(card.gesture.pointers.size);
        figure.dataset.pivotX = ((body.pivotX ?? body.x) + origin.x).toFixed(2);
        figure.dataset.pivotY = ((body.pivotY ?? body.y) + origin.y).toFixed(2);
        moving ||= body.active && body.dynamic && (Math.hypot(body.vx, body.vy) > 1 || Math.abs(body.angularVelocity) > .004);
      }
      mount.dataset.galleryPosition = position.toFixed(3); mount.dataset.galleryVisible = String(visible);
      mount.dataset.galleryContacts = String(contacts);
      return Boolean(moving);
    },
    dispose() {
      disposed = true; clearInterval(timer); cards.forEach(card => release(card, true)); controller.abort(); layer.remove();
    }
  };
}

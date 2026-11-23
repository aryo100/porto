import { createSiteLoading } from './loading.js';
import { createExperienceVisuals, createTimelineBoundaryState, advanceTimelineScroll } from './experience-visuals.js';
import { archiveScrollMode, archiveAdvanceTarget, canControlExperienceScroll } from './archive-scroll.js';
import { canScrollProjectPreview } from './project-preview-mode.mjs';

const siteLoading = createSiteLoading();
const flight = document.querySelector('.flight');
const panels = [...document.querySelectorAll('[data-chapter]')];
const seekers = [...document.querySelectorAll('[data-seek]')];
const journeyPositions = [0, .42, .51, .88];
const recordNodeButtons = [...document.querySelectorAll('[data-record-node]')];
const progressText = document.querySelector('#journey-progress');
const progressBar = document.querySelector('#journey-bar');
const motionButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector('#load-status');
let paused = reducedMotion.matches;
let sceneController;
let toolkitMotion;
let experienceMotion;
let contactMap;
let flightSnap;
let scheduled = false;
let activeChapter = -1;
let scrollProgress = 0;
const journeyLength = () => Math.max(1, flight.offsetHeight - document.querySelector('.flight-viewport').clientHeight);
let journeyDistance = journeyLength();
let archiveInputGuard;
let archiveNavigationBypass = Boolean(location.hash && !['#top', '#about'].includes(location.hash));
let archiveNavigationArrived = false;
let returningToTop = false;
let archiveExitAllowed = archiveNavigationBypass;
const backToTop = document.querySelector('#back-to-top');

function createArchiveScrollGuard({ getMode, onBlock }) {
  let touchY = null;
  const block = (event, delta, mode) => { event.preventDefault(); event.stopImmediatePropagation(); onBlock(delta, mode); };
  addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.deltaY <= 0) return;
    const unit = event.deltaMode === 2 ? innerHeight : event.deltaMode === 1 ? 40 : 1;
    const delta = event.deltaY * unit, mode = getMode(delta);
    if (mode) block(event, delta, mode);
  }, { passive: false, capture: true });
  addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 && !event.target.closest?.('.memory-card, .disc-interaction') ? event.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (touchY === null || event.touches.length !== 1) return;
    const y = event.touches[0].clientY, down = touchY - y; touchY = y;
    if (!event.defaultPrevented && down > 0) {
      const mode = getMode(down);
      if (mode) block(event, down, mode);
    }
  }, { passive: false, capture: true });
  const endTouch = () => { touchY = null; };
  addEventListener('touchend', endTouch, { passive: true });
  addEventListener('touchcancel', endTouch, { passive: true });
  addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || !['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return;
    if (event.key === ' ' && event.shiftKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"], .memory-card, .disc-interaction')) return;
    if (event.key === ' ' && event.target.closest?.('button, a, [role="button"]')) return;
    const delta = event.key === 'End' ? Infinity : event.key === 'ArrowDown' ? 40 : innerHeight;
    const mode = getMode(delta);
    if (mode) block(event, delta, mode);
  }, { capture: true });
  return { reset: endTouch };
}

function updateJourney() {
  scheduled = false;
  const rect = flight.getBoundingClientRect();
  const viewportHeight = document.querySelector('.flight-viewport').clientHeight;
  const distance = Math.max(1, flight.offsetHeight - viewportHeight);
  journeyDistance = distance;
  scrollProgress = Math.min(1, Math.max(0, -rect.top / distance));
  if (!archiveNavigationBypass && scrollProgress < .38) archiveExitAllowed = false;
  // Explicit navigation stays valid even when an offscreen WebGL scene is throttled.
  // Rearm the archive only when the user actually returns into the record chapters.
  if (returningToTop && scrollY <= 1) {
    returningToTop = archiveNavigationBypass = archiveNavigationArrived = false;
  }
  if (!returningToTop && archiveNavigationBypass && scrollProgress >= .99) archiveNavigationArrived = true;
  if (!returningToTop && archiveNavigationBypass && archiveNavigationArrived && scrollProgress < .65) {
    archiveNavigationBypass = archiveNavigationArrived = false;
  }
  if (!archiveNavigationBypass && !archiveExitAllowed && scrollProgress > journeyPositions[2]) {
    if (sceneController?.canExitArchive()) archiveExitAllowed = true;
    else {
      flightSnap?.cancel();
      scrollProgress = journeyPositions[2];
      scrollTo({ top: scrollY + rect.top + distance * scrollProgress, behavior: 'instant' });
      sceneController?.requestArchiveReveal();
    }
  }
  if (sceneController) {
    const accepted = sceneController.setProgress(scrollProgress, { bypass: archiveNavigationBypass || archiveExitAllowed });
    if (accepted < scrollProgress - .0001) {
      // Cancel the original scroll/snap rather than storing its destination for later.
      flightSnap?.cancel();
      const top = scrollY + rect.top;
      scrollProgress = accepted;
      scrollTo({ top: top + distance * accepted, behavior: 'instant' });
    }
  }
  else renderChapters(scrollProgress);
}

// Text and objects share the same rendered progress so they cannot drift during a fast scroll.
function renderChapters(progress) {
  const chapter = progress < .31 ? 0 : progress < .65 ? 1 : 2;
  if (chapter !== activeChapter) {
    activeChapter = chapter;
    panels.forEach((panel, index) => {
      panel.classList.toggle('is-active', index === chapter);
      panel.inert = index !== chapter;
      panel.setAttribute('aria-hidden', String(index !== chapter));
    });
    seekers.forEach((button, index) => {
      button.classList.toggle('active', index === chapter);
      button.setAttribute('aria-pressed', String(index === chapter));
    });
  }
  panels.forEach((panel, index) => {
    let opacity = index === chapter ? 1 : 0;
    if (!paused) {
      if (index === 0) opacity = 1 - smoothstep(.17, .24, progress);
      if (index === 1) opacity = smoothstep(.34, .41, progress);
      if (index === 2) opacity = smoothstep(.68, .75, progress);
    }
    panel.style.opacity = String(opacity);
    if (index === 1) {
      panel.style.transform = `translateY(${-Math.max(0, progress - .51) * journeyDistance}px)`;
      panel.style.visibility = progress >= .31 && progress < .95 ? 'visible' : 'hidden';
    }
  });
  progressText.textContent = String(Math.round(progress * 100)).padStart(3, '0');
  progressBar.style.transform = `scaleX(${progress})`;
  recordNodeButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === (progress >= .465 ? 1 : 0))));
}

function smoothstep(start, end, value) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
function requestJourney() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateJourney); }
}
addEventListener('scroll', requestJourney, { passive: true });
addEventListener('resize', requestJourney);
seekers.forEach(button => button.addEventListener('click', () => {
  returningToTop = false;
  archiveNavigationBypass = archiveNavigationArrived = false;
  flightSnap.goTo([0, 1, 3][Number(button.dataset.seek)]);
}));
recordNodeButtons.forEach(button => button.addEventListener('click', () => {
  returningToTop = false;
  archiveNavigationBypass = archiveNavigationArrived = false;
  flightSnap.goTo(Number(button.dataset.recordNode) + 1);
}));

function setPaused(value) {
  paused = value;
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Resume 3D motion' : 'Pause 3D motion');
  motionButton.querySelector('span').textContent = paused ? 'OFF' : 'ON';
  sceneController?.setPaused(paused);
  toolkitMotion?.sync();
  contactMap?.sync();
  experienceMotion?.update();
  if (paused) { flightSnap?.cancel(); experienceMotion?.cancel(); }
  updateJourney();
}
motionButton.addEventListener('click', () => setPaused(!paused));
reducedMotion.addEventListener('change', event => setPaused(event.matches));
setPaused(paused);

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  menuButton.querySelector('span').textContent = '+';
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', expanded);
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  menuButton.querySelector('span').textContent = expanded ? '−' : '+';
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

const navigationLinks = [...navigation.querySelectorAll('a')];
const navigationSections = navigationLinks.map(link => document.querySelector(link.getAttribute('href')));
let navigationFrame = false;
function syncNavigation() {
  navigationFrame = false;
  const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
  let active = 0;
  navigationSections.forEach((section, index) => {
    const reached = section.id === 'about'
      ? scrollProgress >= .31 && scrollProgress < .65
      : section.getBoundingClientRect().top <= headerBottom + 24;
    if (reached) active = index;
  });
  const scrollRange = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  if (scrollY >= scrollRange - 2) active = navigationLinks.length - 1;
  backToTop.hidden = scrollY < innerHeight * .6;
  backToTop.style.setProperty('--page-progress', scrollRange ? Math.max(0, Math.min(1, scrollY / scrollRange)) : 0);
  navigationLinks.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function requestNavigationSync() {
  if (!navigationFrame) { navigationFrame = true; requestAnimationFrame(syncNavigation); }
}
addEventListener('scroll', requestNavigationSync, { passive: true });
addEventListener('resize', requestNavigationSync);
syncNavigation();

backToTop.addEventListener('click', () => {
  experienceMotion?.cancel(); flightSnap?.cancel(); archiveInputGuard?.reset();
  returningToTop = archiveNavigationBypass = true; archiveNavigationArrived = false;
  scrollTo({ top: 0, behavior: paused ? 'instant' : 'smooth' });
  document.querySelector('.site-header .brand').focus({ preventScroll: true });
});
const interruptReturn = () => {
  if (!returningToTop) return;
  scrollTo({ top: scrollY, behavior: 'instant' });
  returningToTop = false; archiveNavigationBypass = scrollProgress >= .65;
  archiveNavigationArrived = scrollProgress >= .99;
};
addEventListener('wheel', interruptReturn, { passive: true, capture: true });
addEventListener('touchstart', interruptReturn, { passive: true, capture: true });
addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interruptReturn();
}, { capture: true });
addEventListener('pointerdown', event => {
  if (event.clientX >= document.documentElement.clientWidth) interruptReturn();
}, { passive: true, capture: true });

document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const workSection = document.querySelector('#work');
const achievementSection = document.querySelector('#achievements');
const achievementStage = achievementSection.querySelector('.achievement-stage');
const achievementCards = [...document.querySelectorAll('.achievement-card')];
let achievementFrame = 0;
let currentAchievement = -1;
function syncAchievements() {
  achievementFrame = 0;
  if (!achievementCards.length || reducedMotion.matches) return;
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 100;
  const step = Math.max(1, (achievementStage.offsetHeight + headerHeight) * .8);
  const progress = Math.max(0, Math.min(achievementCards.length - 1, (headerHeight - achievementSection.getBoundingClientRect().top) / step));
  achievementCards.forEach((card, index) => {
    const age = progress - index;
    const depth = Math.min(4, Math.max(0, age));
    card.style.zIndex = String(index + 1);
    const visible = age > -1 && age < 5;
    card.style.pointerEvents = visible ? 'auto' : 'none';
    if (card.hasAttribute('href')) card.tabIndex = visible ? 0 : -1;
    if (age < 0) {
      card.style.transform = `translate3d(0, ${Math.min(110, -age * 110)}%, 0)`;
      card.style.opacity = age > -1 ? '1' : '0';
      card.style.visibility = age > -1 ? 'visible' : 'hidden';
      card.style.filter = 'brightness(1)';
    } else {
      card.style.transform = `translate3d(0, ${-16 * depth}px, 0) scale(${1 - .03 * depth})`;
      card.style.opacity = String(Math.max(0, Math.min(1, 5 - age)));
      card.style.visibility = age < 5 ? 'visible' : 'hidden';
      card.style.filter = `brightness(${1 - .1 * depth})`;
    }
  });
  const active = Math.round(progress);
  if (active !== currentAchievement) {
    currentAchievement = active;
    document.querySelector('.achievement-progress').textContent = `${String(active + 1).padStart(2, '0')} / ${String(achievementCards.length).padStart(2, '0')}`;
  }
}
function requestAchievementSync() {
  if (!achievementFrame) achievementFrame = requestAnimationFrame(syncAchievements);
}
addEventListener('scroll', requestAchievementSync, { passive: true });
addEventListener('resize', requestAchievementSync);
reducedMotion.addEventListener('change', requestAchievementSync);
syncAchievements();
const projectCards = [...workSection.querySelectorAll('.project-card')];
projectCards.forEach((card, index) => card.style.setProperty('--reveal-delay', `${index % 3 * 110}ms`));
const projectRevealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      entry.target.dataset.projectReveal = 'visible';
      projectRevealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
projectCards.forEach(card => projectRevealObserver.observe(card));
workSection.classList.add('project-motion-ready');

document.querySelectorAll('.project-browser, [data-mobile-animation="scroll"]').forEach(preview => {
  const mobile = preview.dataset.mobileAnimation === 'scroll';
  const viewport = preview.querySelector(mobile ? '.phone-screen' : '.project-browser-view');
  const page = preview.querySelector(mobile ? '.phone-scroll-track' : '.project-page');
  if (!page) return;
  const image = page.querySelector('img');
  function measurePreview() {
    const card = preview.closest('.project-card');
    const setting = preview.dataset.scrollAnimation || card?.dataset.scrollAnimation;
    const selected = setting === 'on' ? true : setting === 'off' ? false : null;
    const eligible = Boolean(image && canScrollProjectPreview(image.currentSrc || image.src, image.naturalWidth, image.naturalHeight, mobile, selected));
    const imageHeight = image?.naturalWidth ? viewport.clientWidth * image.naturalHeight / image.naturalWidth : 0;
    const canScroll = eligible && imageHeight > viewport.clientHeight + 1;
    preview.classList.toggle('is-cover', !canScroll);
    preview.tabIndex = canScroll ? 0 : -1;
    preview.setAttribute('aria-label', `${mobile ? 'Mobile' : 'Desktop'} ${canScroll ? 'scrolling preview' : 'cover'} of ${preview.closest('.project-card')?.querySelector('h3')?.textContent || 'project'}`);
    preview.style.setProperty('--preview-window-height', `${viewport.clientHeight}px`);
    const travel = canScroll ? Math.max(0, page.scrollHeight - viewport.clientHeight) : 0;
    preview.style.setProperty('--preview-travel', `${travel}px`);
    preview.style.setProperty('--preview-duration', `${Math.max(3.5, travel / (mobile ? 65 : 85))}s`);
    preview.dataset.previewTravel = String(travel);
    card?.classList.toggle('has-preview-travel', [...card.querySelectorAll('.project-browser, .project-phone')].some(item => Number(item.dataset.previewTravel) > 0));
  }
  const observer = new ResizeObserver(measurePreview);
  observer.observe(viewport);
  observer.observe(page);
  image?.addEventListener('load', measurePreview);
  image?.addEventListener('error', measurePreview);
  document.fonts.ready.then(measurePreview);
  measurePreview();
});

document.querySelectorAll('.project-tilt').forEach(preview => {
  preview.addEventListener('pointermove', event => {
    if (paused || event.pointerType !== 'mouse') return;
    const bounds = preview.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    preview.style.setProperty('--tilt-x', `${(y - .5) * -8}deg`);
    preview.style.setProperty('--tilt-y', `${(x - .5) * 8}deg`);
    preview.style.setProperty('--glare-x', `${x * 100}%`);
    preview.style.setProperty('--glare-y', `${y * 100}%`);
  });
  preview.addEventListener('pointerleave', () => {
    preview.style.removeProperty('--tilt-x');
    preview.style.removeProperty('--tilt-y');
  });
});
const contactAddress = document.querySelector('#contact-address');
const contactStatus = document.querySelector('#contact-status');
contactAddress.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(contactAddress.dataset.address);
    contactStatus.textContent = 'EMAIL ADDRESS COPIED';
  } catch {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(contactAddress.querySelector(':scope > span'));
      selection.removeAllRanges(); selection.addRange(range);
    }
    contactStatus.textContent = selection ? 'ADDRESS SELECTED · USE COPY' : 'SELECT THE ADDRESS TO COPY IT MANUALLY';
  }
});

function samplePulsarPoint(x, y, pointer) {
  if (!pointer) return { x, y };
  const dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx, dy);
  if (distance >= 110) return { x, y };
  const displacement = 61 * Math.pow(1 - distance / 110, 1.35);
  const length = Math.max(4, distance);
  return { x: x + dx / length * displacement, y: y + dy / length * displacement };
}

function createContactMap() {
  const canvas = document.querySelector('#contact-map'), context = canvas.getContext('2d');
  const width = 520, height = 440, origin = { x: 151, y: 226 };
  // A stylized trace of the lower-left Golden Record diagram: 14 rays and its long baseline.
  const endpoints = [[476,230],[247,205],[267,88],[204,148],[179,151],[136,126],[86,181],
    [28,239],[66,249],[108,279],[142,333],[247,377],[307,270],[209,295],[188,267]];
  const rays = endpoints.map(([x, y], index) => {
    const dx = x - origin.x, dy = y - origin.y, length = Math.hypot(dx, dy), count = Math.ceil(length / 4.35);
    return Array.from({ length: count }, (_, step) => {
      const t = (step + 1) / count, x0 = origin.x + dx * t, y0 = origin.y + dy * t;
      return { x0, y0, x: x0, y: y0, nx: -dy / length, ny: dx / length,
        tick: step > 5 && (step * 7 + index * 3) % 11 < 3, end: step === count - 1,
        bright: (step * 13 + index * 5) % 17 < 5 };
    });
  });
  const hub = { x0: origin.x, y0: origin.y, ...origin };
  const particles = rays.flat(), points = [hub, ...particles];
  let pointer = null, grabbed = null, frameId = 0, lastTime = 0;
  const glow = { x: origin.x, y: origin.y, alpha: 0 };
  const keyboard = { ...origin };
  function draw() {
    if (!context) return;
    context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    context.clearRect(0, 0, width, height);
    if (glow.alpha > .01) {
      const light = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 76);
      light.addColorStop(0, `rgba(218,164,78,${glow.alpha * .2})`); light.addColorStop(1, 'rgba(218,164,78,0)');
      context.fillStyle = light; context.fillRect(glow.x - 76, glow.y - 76, 152, 152);
    }
    context.lineWidth = .75; context.strokeStyle = '#c5a46b29'; context.beginPath();
    rays.forEach(ray => {
      context.moveTo(hub.x, hub.y);
      ray.forEach(point => context.lineTo(point.x, point.y));
    });
    context.stroke();
    for (const point of particles) {
      const influenced = pointer && Math.hypot(point.x0 - pointer.x, point.y0 - pointer.y) < 68;
      context.fillStyle = point.end || influenced ? '#f2d69e' : point.bright ? '#d2ac69' : '#9c7746';
      context.beginPath(); context.arc(point.x, point.y, point.end ? 2.5 : point.bright ? 1.45 : 1.05, 0, Math.PI * 2); context.fill();
      if (point.tick) {
        context.strokeStyle = point.bright ? '#e0bb7999' : '#b38b5470'; context.beginPath();
        context.moveTo(point.x + point.nx * 2.7, point.y + point.ny * 2.7);
        context.lineTo(point.x + point.nx * 6, point.y + point.ny * 6); context.stroke();
      }
    }
    context.fillStyle = '#f0cb8a'; context.beginPath(); context.arc(hub.x, hub.y, 3.3, 0, Math.PI * 2); context.fill();
    if (glow.alpha > .01) {
      context.fillStyle = `rgba(255,231,177,${glow.alpha})`;
      context.beginPath(); context.arc(glow.x, glow.y, 2.9, 0, Math.PI * 2); context.fill();
    }
  }
  function frame(time) {
    frameId = 0;
    if (document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min(.05, (time - lastTime) / 1000) : 1 / 60;
    const ease = paused ? 1 : 1 - Math.exp(-dt * (pointer ? 20 : 13)); lastTime = time;
    let moving = false, displacement = 0;
    for (const point of points) {
      const next = samplePulsarPoint(point.x0, point.y0, pointer);
      const dx = next.x - point.x, dy = next.y - point.y;
      if (Math.abs(dx) + Math.abs(dy) < .08 || paused) { point.x = next.x; point.y = next.y; }
      else { point.x += dx * ease; point.y += dy * ease; moving = true; }
      displacement = Math.max(displacement, Math.hypot(point.x - point.x0, point.y - point.y0));
    }
    const alpha = pointer ? 1 : 0;
    glow.alpha = Math.abs(alpha - glow.alpha) < .01 || paused ? alpha : glow.alpha + (alpha - glow.alpha) * ease;
    canvas.dataset.mapDisplacement = displacement.toFixed(2);
    canvas.dataset.mapCenterDisplacement = Math.hypot(hub.x - hub.x0, hub.y - hub.y0).toFixed(2);
    draw();
    if (moving || glow.alpha !== alpha) frameId = requestAnimationFrame(frame);
    else lastTime = 0;
  }
  function wake() { if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame); }
  function setPointer(value) {
    pointer = value;
    if (value) { glow.x = value.x; glow.y = value.y; }
    wake();
  }
  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const clamp = (value, limit) => Math.max(0, Math.min(limit, value));
    return { x: clamp((event.clientX - rect.left) / rect.width * width, width), y: clamp((event.clientY - rect.top) / rect.height * height, height) };
  }
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || grabbed === event.pointerId) setPointer(pointFromEvent(event));
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || grabbed !== null) return;
    if (event.pointerType !== 'mouse') { grabbed = event.pointerId; canvas.setPointerCapture(grabbed); }
    setPointer(pointFromEvent(event));
  });
  canvas.addEventListener('pointerleave', () => { if (grabbed === null) setPointer(null); });
  const endTouch = event => { if (event.pointerId === grabbed) { grabbed = null; setPointer(null); } };
  canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
  canvas.addEventListener('lostpointercapture', endTouch);
  canvas.addEventListener('blur', () => setPointer(null));
  canvas.addEventListener('keydown', event => {
    const step = { ArrowLeft: [-22,0], ArrowRight: [22,0], ArrowUp: [0,-22], ArrowDown: [0,22] }[event.key];
    if (!step && !['Home', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (!step) { Object.assign(keyboard, origin); setPointer(null); return; }
    keyboard.x = Math.max(0, Math.min(width, keyboard.x + step[0])); keyboard.y = Math.max(0, Math.min(height, keyboard.y + step[1]));
    setPointer({ ...keyboard });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPointer(null); else wake(); });
  function prepare() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5), w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(w * height / width));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    draw();
    canvas.dataset.mapPrepared = 'true';
  }
  new ResizeObserver(prepare).observe(canvas); prepare();
  return { prepare, sync: wake };
}
contactMap = createContactMap();

function createGlobeRotation() {
  let x = 0, y = 0, z = 0, w = 1;
  return {
    rotate(dx, dy) {
      const length = Math.hypot(dx, dy);
      if (!length) return;
      const sine = Math.sin(length * .008 / 2) / length;
      const ax = -dy * sine, ay = dx * sine, aw = Math.cos(length * .008 / 2);
      const nx = aw * x + ax * w + ay * z;
      const ny = aw * y - ax * z + ay * w;
      const nz = aw * z + ax * y - ay * x;
      const nw = aw * w - ax * x - ay * y;
      const norm = Math.hypot(nx, ny, nz, nw);
      x = nx / norm; y = ny / norm; z = nz / norm; w = nw / norm;
    },
    project(point) {
      const tx = 2 * (y * point.z - z * point.y);
      const ty = 2 * (z * point.x - x * point.z);
      const tz = 2 * (x * point.y - y * point.x);
      return { x: point.x + w * tx + y * tz - z * ty,
        y: point.y + w * ty + z * tx - x * tz,
        z: point.z + w * tz + x * ty - y * tx };
    },
    quaternion: () => [x, y, z, w]
  };
}

function createHorizontalDrag({ element, onDrag, onStart = () => {}, onEnd = () => {}, allowVertical = false }) {
  let pointer = null;
  function start(event) {
    pointer.pending = false;
    element.setPointerCapture(event.pointerId);
    element.focus({ preventScroll: true });
    element.classList.toggle('is-dragging', true);
    onStart();
  }
  function down(event) {
    if (pointer || event.button !== 0) return;
    pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, time: event.timeStamp, movedAt: -Infinity,
      velocityX: 0, velocityY: 0, pending: event.pointerType === 'touch' && !allowVertical };
    if (!pointer.pending) { start(event); event.preventDefault(); }
  }
  function move(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (pointer.pending) {
      const dx = Math.abs(event.clientX - pointer.startX), dy = Math.abs(event.clientY - pointer.startY);
      if (dy > 6 && dy > dx * 1.1) { pointer = null; return; }
      if (dx <= 6 || dx <= dy * 1.1) return;
      start(event);
    }
    const delta = event.clientX - pointer.x;
    const deltaY = allowVertical ? event.clientY - pointer.y : 0;
    const dt = Math.max(1 / 240, Math.min(.1, (event.timeStamp - pointer.time) / 1000));
    pointer.velocityX = Math.max(-1200, Math.min(1200, delta / dt));
    pointer.velocityY = Math.max(-1200, Math.min(1200, deltaY / dt));
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.time = pointer.movedAt = event.timeStamp;
    onDrag(delta, deltaY);
    event.preventDefault();
  }
  function finish(event, cancelled = false) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const previous = pointer;
    pointer = null;
    if (element.hasPointerCapture(previous.id)) element.releasePointerCapture(previous.id);
    element.classList.toggle('is-dragging', false);
    const stopped = cancelled || event.timeStamp - previous.movedAt > 100;
    if (!previous.pending) onEnd(stopped ? 0 : previous.velocityX, stopped ? 0 : previous.velocityY);
  }
  const up = event => finish(event);
  const cancel = event => finish(event, true);
  function key(event) {
    if (!(allowVertical ? ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']).includes(event.key)) return;
    onStart();
    onDrag(event.key === 'ArrowRight' ? 48 : event.key === 'ArrowLeft' ? -48 : 0,
      event.key === 'ArrowDown' ? 48 : event.key === 'ArrowUp' ? -48 : 0);
    onEnd(0, 0);
    event.preventDefault();
  }
  const handlers = { pointerdown: down, pointermove: move, pointerup: up,
    pointercancel: cancel, lostpointercapture: cancel, keydown: key };
  Object.entries(handlers).forEach(([name, callback]) => element.addEventListener(name, callback));
  return {
    get dragging() { return Boolean(pointer && !pointer.pending); },
    dispose() {
      if (pointer) finish({ pointerId: pointer.id, timeStamp: 0 }, true);
      Object.entries(handlers).forEach(([name, callback]) => element.removeEventListener(name, callback));
    }
  };
}

function createToolkitMotion() {
  const section = document.querySelector('.signal-toolkit');
  const sphere = section.querySelector('[data-toolkit-sphere]');
  const categories = [...section.querySelectorAll('.toolkit-categories > div')];
  const entries = categories.flatMap(category => [...category.querySelectorAll('li')].map(item => ({
    label: item.textContent, category: category.querySelector('h3').textContent
  })));
  const labels = entries.map(entry => entry.label);
  section.querySelector('[data-toolkit-count]').textContent = `${labels.length} technologies`;
  section.querySelector('[data-toolkit-disciplines]').textContent = `· ${categories.length} disciplines`;
  const midpoint = Math.ceil(labels.length / 2);
  const marquees = [...section.querySelectorAll('[data-toolkit-marquee]')].map((track, index) => {
    const words = index === 0 ? entries.slice(0, midpoint) : entries.slice(midpoint);
    for (let repeat = 0; repeat < 2; repeat++) {
      const group = document.createElement('div');
      group.className = 'toolkit-marquee-group';
      words.forEach(word => {
        const item = document.createElement('span');
        item.className = 'toolkit-marquee-item';
        const dot = document.createElement('span');
        dot.className = 'toolkit-wire-dot';
        dot.textContent = '·';
        item.append(dot);
        if (index === 0) {
          const number = document.createElement('span');
          number.className = 'toolkit-wire-index';
          number.textContent = String(entries.indexOf(word) + 1).padStart(2, '0');
          item.append(number);
        }
        const name = document.createElement('span');
        name.className = index === 0 ? 'toolkit-wire-name' : 'toolkit-wire-handle';
        name.textContent = word.label;
        item.append(name);
        if (index === 1) {
          const role = document.createElement('span');
          role.className = 'toolkit-wire-role';
          role.textContent = word.category;
          item.append(role);
        }
        group.append(item);
      });
      track.append(group);
    }
    return { track, index, width: 0, offset: 0, velocity: 0, hovered: false, control: null };
  });
  const points = labels.map((label, index) => {
    const y = 1 - 2 * (index + .5) / labels.length;
    const radius = Math.sqrt(1 - y * y);
    const theta = index * Math.PI * (3 - Math.sqrt(5));
    const tag = document.createElement('span');
    tag.className = 'toolkit-sphere-tag';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = label;
    sphere.append(tag);
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, tag };
  });
  let visible = false, raf = 0, lastTime = 0, sphereRadius = 1;
  const rotation = createGlobeRotation();
  rotation.rotate(0, -.2 / .008);
  rotation.rotate(.35 / .008, 0);
  let globeVelocityX = 0, globeVelocityY = 0;
  let sphereControl;
  function draw() {
    marquees.forEach(state => {
      if (state.width > 0) state.offset = -(((-state.offset % state.width) + state.width) % state.width);
      state.track.style.transform = `translate3d(${state.offset}px, 0, 0)`;
      state.track.dataset.offset = state.offset.toFixed(3);
    });
    const radius = sphereRadius;
    points.forEach(point => {
      const { x, y, z } = rotation.project(point);
      const depth = (z + 1) / 2;
      point.tag.style.transform = `translate(-50%, -50%) translate3d(${x * radius}px, ${y * radius}px, 0) scale(${.68 + depth * .5})`;
      point.tag.style.opacity = String(.2 + depth * .8);
      point.tag.style.zIndex = String(Math.round(depth * 100));
      point.tag.classList.toggle('is-front', z > .5);
    });
    sphere.dataset.rotation = rotation.quaternion().map(value => value.toFixed(6)).join(',');
  }
  function tick(time) {
    raf = 0;
    if (!visible || paused || document.hidden) return;
    const dt = Math.min((time - (lastTime || time)) / 1000, .06);
    lastTime = time;
    const decay = Math.exp(-4 * dt), travel = (1 - decay) / 4;
    if (!sphereControl.dragging) {
      rotation.rotate(dt * .14 / .008 + globeVelocityX * travel, globeVelocityY * travel);
      globeVelocityX *= decay;
      globeVelocityY *= decay;
    }
    marquees.forEach(state => {
      if (!state.control.dragging && !state.hovered) {
        state.offset += (state.index === 0 ? -state.width / 52 : state.width / 64) * dt + state.velocity * travel;
        state.velocity *= decay;
      }
    });
    draw();
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    section.classList.toggle('is-motion-paused', paused || document.hidden);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
    if (visible && !paused && !document.hidden) raf = requestAnimationFrame(tick);
    else draw();
  }
  marquees.forEach(state => {
    state.track.parentElement.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') state.hovered = true; });
    state.track.parentElement.addEventListener('pointerleave', () => { state.hovered = false; });
    state.control = createHorizontalDrag({
      element: state.track.parentElement,
      onStart: () => { state.velocity = 0; },
      onDrag: delta => { state.offset += delta; draw(); },
      onEnd: velocity => { state.velocity = paused ? 0 : velocity; sync(); }
    });
  });
  sphereControl = createHorizontalDrag({
    element: sphere, allowVertical: true,
    onStart: () => { globeVelocityX = 0; globeVelocityY = 0; },
    onDrag: (dx, dy) => { rotation.rotate(dx, dy); draw(); },
    onEnd: (vx, vy) => {
      const factor = paused ? 0 : Math.min(1, 312.5 / (Math.hypot(vx, vy) || 1));
      globeVelocityX = vx * factor; globeVelocityY = vy * factor;
      sync();
    }
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    section.classList.toggle('is-in-view', visible);
    sync();
  }, { rootMargin: '100px' }).observe(section);
  function measure() {
    sphereRadius = sphere.clientWidth * .41;
    marquees.forEach(state => {
      const width = state.track.firstElementChild.getBoundingClientRect().width;
      if (width > 0) {
        state.offset = state.width ? state.offset / state.width * width : (state.index ? -width * .35 : 0);
        state.width = width;
      }
    });
    draw();
  }
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(sphere);
  marquees.forEach(state => resizeObserver.observe(state.track.firstElementChild));
  document.addEventListener('visibilitychange', sync);
  measure();
  return { sync };
}
toolkitMotion = createToolkitMotion();

function getExperienceYear(stops, position, years) {
  if (position <= stops[0]) return years[0];
  const last = stops.length - 1;
  if (position >= stops[last]) return years[last];
  const upper = stops.findIndex(stop => stop > position);
  const progress = (position - stops[upper - 1]) / Math.max(1, stops[upper] - stops[upper - 1]);
  // Give the opening year a reading interval before the year counter starts moving.
  const fraction = upper === 1 ? Math.max(0, (progress - .3) / .7) : progress;
  const year = years[upper - 1] + (years[upper] - years[upper - 1]) * fraction;
  return Math.abs(year - Math.round(year)) < .01 ? Math.round(year) : year;
}

function getExperienceSnapTarget(stops, position, direction) {
  if (stops.length < 2 || !direction) return null;
  const last = stops.length - 1;
  if (position < stops[0] - (stops[1] - stops[0]) * .45 || position > stops[last] + (stops[last] - stops[last - 1]) * .45) return null;
  if ((direction < 0 && position < stops[0] - 2) || (direction > 0 && position > stops[last] + 2)) return null;
  let target = 0;
  if (position >= stops[last]) target = last;
  else if (position > stops[0]) {
    const upper = stops.findIndex(stop => stop > position);
    const fraction = (position - stops[upper - 1]) / (stops[upper] - stops[upper - 1]);
    target = fraction >= (direction > 0 ? .28 : .72) ? upper : upper - 1;
  }
  return Math.abs(stops[target] - position) <= 2 ? null : target;
}

function createExperienceTimeline() {
  const section = document.querySelector('#experience');
  const clock = section.querySelector('.experience-clock');
  const items = [...section.querySelectorAll('.experience-item')];
  const visuals = createExperienceVisuals({ section, clock, line: section.querySelector('.experience-line'),
    list: section.querySelector('.experience-list'), isPaused: () => paused });
  const digits = [...section.querySelectorAll('[data-experience-digit]')];
  const years = items.map(item => Number(item.dataset.experienceNumber));
  const firstYear = Math.max(...years), lastYear = Math.min(...years);
  const yearSequence = Array.from({ length: firstYear - lastYear + 1 }, (_, index) => String(firstYear - index));
  const controls = [...section.querySelectorAll('[data-experience-step]')];
  digits.forEach((digit, index) => {
    digit.classList.add('experience-digit');
    digit.replaceChildren(...yearSequence.map(year => {
      const row = document.createElement('i');
      row.textContent = year[index];
      return row;
    }));
  });
  let active = -1, raf = 0, inView = false, cachedStops = [], cachedAnchor = innerHeight * .5;
  function anchor() {
    const stickyTop = parseFloat(getComputedStyle(clock).top) || 0;
    const clockBottom = stickyTop + clock.offsetHeight;
    return matchMedia('(max-width: 700px)').matches
      ? clockBottom + (innerHeight - clockBottom) * .3
      : innerHeight * .5;
  }
  function update() {
    raf = 0;
    if (!cachedStops.length) return;
    const target = cachedAnchor;
    const positions = cachedStops.map(stop => stop - scrollY + target);
    const nearest = positions.reduce((best, y, index) => Math.abs(y - target) < Math.abs(positions[best] - target) ? index : best, 0);
    const progress = Math.min(1, Math.max(0, (target - positions[0]) / Math.max(1, positions.at(-1) - positions[0])));
    const year = paused ? years[nearest] : getExperienceYear(positions, target, years);
    const yearStep = Math.max(0, Math.min(yearSequence.length - 1, firstYear - year));
    const lower = Math.floor(yearStep), upper = Math.min(yearSequence.length - 1, lower + 1);
    digits.forEach((digit, index) => {
      // Adjacent rows represent adjacent years, so 2020→2019 rolls together without passing incorrect digits.
      const offset = yearSequence[lower][index] === yearSequence[upper][index] ? lower : yearStep;
      digit.style.setProperty('--year-step', offset);
      digit.dataset.value = String(Math.round(year))[index];
    });
    section.dataset.experienceYear = String(Math.round(year));
    section.dataset.experienceYearProgress = year.toFixed(4);
    section.style.setProperty('--experience-progress', progress);
    section.style.setProperty('--dial-turn', `${paused ? 0 : progress * -45}deg`);
    visuals.update({ positions, anchor: target, progress });
    items.forEach((item, index) => {
      item.style.setProperty('--item-opacity', String(Math.max(.24, 1 - Math.abs(positions[index] - target) / (innerHeight * .8))));
    });
    if (nearest !== active) {
      active = nearest;
      section.dataset.experienceActive = String(active);
      items.forEach((item, index) => {
        item.classList.toggle('is-active', index === active);
        if (index === active) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      section.querySelector('[data-experience-when]').textContent = items[active].dataset.experienceLabel;
      section.querySelector('[data-experience-count]').textContent = String(active + 1).padStart(2, '0');
      controls[0].disabled = active === 0;
      controls[1].disabled = active === items.length - 1;
    }
  }
  function schedule() {
    if (inView && !raf) raf = requestAnimationFrame(update);
  }
  function measure() {
    const offset = innerWidth <= 700 ? 55 : 60;
    cachedAnchor = anchor();
    const positions = items.map(item => scrollY + item.getBoundingClientRect().top + offset);
    const lineRect = section.querySelector('.experience-line').getBoundingClientRect();
    const listRect = section.querySelector('.experience-list').getBoundingClientRect();
    cachedStops = positions.map(position => position - cachedAnchor);
    visuals.measure({ x: listRect.left - lineRect.left, start: positions[0] - scrollY - lineRect.top,
      length: positions.at(-1) - positions[0], pageTop: scrollY + lineRect.top, viewportLeft: lineRect.left });
    schedule();
  }
  const snap = createSectionScrollSnap({ element: section, getStops: () => cachedStops, isPaused: () => paused, onScroll: schedule, stateKey: 'experienceSnap' });
  const boundary = createExperienceBoundaryGuard({
    getStops: () => cachedStops,
    onClamp: () => snap.cancel(), onControl: () => snap.cancel(), isPaused: () => paused,
    canControl: () => canControlExperienceScroll(scrollY >= journeyDistance + innerHeight * .5, {
      bypass: archiveNavigationBypass,
      archiveReleased: archiveExitAllowed,
      sceneReady: !sceneController || sceneController.canExitArchive()
    }),
    onRest: direction => { const next = getExperienceSnapTarget(cachedStops, scrollY, direction); if (next !== null) snap.goTo(next); },
    onInput: kind => { if (kind === 'wheel') section.dataset.wheelEvents = String(Number(section.dataset.wheelEvents || 0) + 1); },
    onState: (value, target) => { section.dataset.experienceBoundary = value; section.dataset.scrollTarget = target === null ? '' : String(target); }
  });
  controls.forEach(button => button.addEventListener('click', () => {
    const next = Math.min(items.length - 1, Math.max(0, active + Number(button.dataset.experienceStep)));
    snap.goTo(next);
  }));
  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(section);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, { rootMargin: '120px' }).observe(section);
  document.fonts.ready.then(measure);
  measure();
  update();
  section.classList.add('experience-ready');
  return { update,
    async prepare() { measure(); update(); await visuals.prepare(); measure(); update(); },
    cancel() { snap.cancel(); boundary.reset(); } };
}
experienceMotion = createExperienceTimeline();

function createExperienceBoundaryGuard({ getStops, onClamp, onState, onControl = () => {}, onRest = () => {},
  isPaused = () => false, canControl = () => true, onInput = () => {} }) {
  const state = createTimelineBoundaryState(), root = document.documentElement;
  let target = null, raf = 0, previousTime = 0, lastY = scrollY, animationY = scrollY, direction = 0;
  let heldEndpoint = null, arrived = false, watching = false, quietTimer = 0, quiet = true;
  let touchY = null, touchTime = 0, touchVelocity = 0, freshTouch = false;
  const editable = element => element.closest?.('input, textarea, select, [contenteditable="true"], .memory-card, .disc-interaction');
  const directGesture = element => editable(element) || element.closest?.('[data-toolkit-sphere], [data-toolkit-marquee]');
  const setState = () => onState(heldEndpoint === null ? (target === null ? 'idle' : 'easing')
    : heldEndpoint === getStops()[0] ? 'top-held' : 'bottom-held', target);
  function stopDriver() {
    cancelAnimationFrame(raf); raf = 0; target = null; previousTime = 0;
    root.classList.remove('experience-scroll-owned');
  }
  function reset() {
    stopDriver(); state.reset(); heldEndpoint = null; arrived = false;
    watching = false; direction = 0; lastY = scrollY; touchY = null; touchVelocity = 0;
    clearTimeout(quietTimer); quiet = true; setState();
  }
  function rest() {
    if (target === null || raf || !quiet || heldEndpoint !== null || arrived || touchY !== null) return;
    const finishedDirection = direction, position = scrollY, stops = getStops();
    stopDriver(); watching = false; state.reset(); setState();
    if (position >= stops[0] - 2 && position <= stops.at(-1) + 2) onRest(finishedDirection);
  }
  function armQuiet() {
    quiet = false; clearTimeout(quietTimer);
    quietTimer = setTimeout(() => { quiet = true; rest(); }, 180);
  }
  function frame(time) {
    raf = 0;
    if (target === null) return;
    const dt = previousTime ? (time - previousTime) / 1000 : 1 / 60; previousTime = time;
    // Integrate subpixels separately from the browser's rounded scroll position.
    animationY = isPaused() ? target : advanceTimelineScroll(animationY, target, dt);
    if (animationY === target || Math.round(animationY) !== Math.round(scrollY)) {
      scrollTo({ top: animationY, behavior: 'instant' }); lastY = scrollY;
    }
    if (animationY === target) {
      previousTime = 0;
      if (heldEndpoint !== null) {
        heldEndpoint = null; arrived = true; watching = false; state.reset();
        clearTimeout(quietTimer); quiet = true;
        root.classList.remove('experience-scroll-owned');
        onState('idle', null);
      } else rest();
    } else raf = requestAnimationFrame(frame);
  }
  function drive(nextTarget) {
    if (!raf) animationY = scrollY;
    target = Math.max(0, Math.min(root.scrollHeight - innerHeight, nextTarget));
    root.classList.add('experience-scroll-owned');
    if (!raf) raf = requestAnimationFrame(frame);
    setState();
  }
  function consume(delta, { fresh = false, continuation = false, forceOwn = false, nativeFrom = null } = {}) {
    const stops = getStops();
    if (!stops.length || !delta || document.body.classList.contains('is-loading') || document.querySelector('dialog[open]')) return false;
    watching = true;
    if (!canControl()) return false;
    const first = stops[0], last = stops.at(-1), nextDirection = Math.sign(delta), time = performance.now();
    const reversing = direction && nextDirection !== direction && continuation !== 'scroll';
    const base = nativeFrom ?? (target !== null && !reversing ? target : scrollY);
    const result = state.sample({ first, last, position: base, delta, time, fresh: fresh || arrived,
      continuation, settled: heldEndpoint === null });
    if (reversing) animationY = scrollY;
    arrived = false;
    direction = nextDirection;
    if (result.blocked) {
      if (heldEndpoint !== result.target) {
        heldEndpoint = result.target;
        onClamp(result.target);
      }
    } else heldEndpoint = null;
    const next = result.blocked ? result.target : base + delta;
    const leaving = !result.blocked && ((base <= first + .5 && nextDirection < 0) || (base >= last - .5 && nextDirection > 0));
    if (leaving && !forceOwn) {
      const wasOwned = target !== null;
      stopDriver(); watching = false; state.reset(); setState();
      if (wasOwned) {
        // The browser hit-tested this wheel while root scrolling was locked. Apply it once
        // explicitly so the first fresh gesture moves, rather than merely unlocking.
        onControl();
        scrollTo({ top: Math.max(0, Math.min(root.scrollHeight - innerHeight, next)), behavior: isPaused() ? 'instant' : 'smooth' });
        return true;
      }
      return false;
    }
    const near = base >= first - innerHeight && base <= last + innerHeight;
    const crossing = Math.min(base, next) <= last && Math.max(base, next) >= first;
    if (!forceOwn && !result.blocked && target === null && !near && !crossing) return false;
    onControl(); armQuiet(); drive(next); return true;
  }
  addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || editable(event.target)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    onInput('wheel', delta); lastY = scrollY;
    if (consume(delta)) event.preventDefault();
  }, { passive: false });
  addEventListener('touchstart', event => {
    reset();
    if (event.touches.length !== 1 || directGesture(event.target)) return;
    touchY = event.touches[0].clientY; touchTime = performance.now(); freshTouch = true;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (touchY === null || event.touches.length !== 1) return;
    const nextY = event.touches[0].clientY, delta = touchY - nextY, time = performance.now();
    touchVelocity = Math.max(-4000, Math.min(4000, delta / Math.max(.008, (time - touchTime) / 1000)));
    touchY = nextY; touchTime = time; lastY = scrollY;
    const stops = getStops(), near = scrollY >= stops[0] - innerHeight && scrollY <= stops.at(-1) + innerHeight;
    if (consume(delta, { fresh: freshTouch, continuation: !freshTouch, forceOwn: target !== null || near })) event.preventDefault();
    freshTouch = false;
  }, { passive: false });
  addEventListener('touchend', event => {
    if (event.touches?.length) return;
    const coast = touchY !== null && target !== null && heldEndpoint === null && !arrived && performance.now() - touchTime < 100 ? touchVelocity * .14 : 0;
    touchY = null;
    if (Math.abs(coast) > 8) consume(coast, { continuation: true, forceOwn: true });
    armQuiet();
  }, { passive: true });
  addEventListener('touchcancel', reset, { passive: true });
  addEventListener('pointerdown', event => { if (event.clientX >= root.clientWidth) reset(); }, { passive: true });
  addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || directGesture(event.target)) return;
    if (event.key === ' ' && event.target.closest?.('button, a')) return;
    const delta = ({ ArrowUp: -40, ArrowDown: 40, PageUp: -innerHeight * .85, PageDown: innerHeight * .85,
      Home: -root.scrollHeight, End: root.scrollHeight, ' ': innerHeight * (event.shiftKey ? -.85 : .85) })[event.key];
    if (delta && consume(delta, { fresh: !event.repeat, continuation: event.repeat })) event.preventDefault();
  });
  addEventListener('scroll', () => {
    const before = lastY; lastY = scrollY;
    if (arrived && Math.abs(scrollY - target) > 1) { reset(); return; }
    if (target === null && watching && Math.abs(lastY - before) > .1 && canControl()) {
      consume(lastY - before, { continuation: 'scroll', nativeFrom: before });
    }
  }, { passive: true });
  document.addEventListener('click', event => {
    if (event.target.closest?.('a[href], [data-experience-step], #motion-toggle, #back-to-top')) reset();
  }, { capture: true });
  addEventListener('resize', reset);
  return { reset };
}

function createSectionScrollSnap({ element, getStops, isPaused, onScroll: onPositionChange = () => {}, stateKey }) {
  let settleTimer = 0, lastY = scrollY, direction = 0;
  let userScrolling = false, touching = false, snapPosition = null;
  function clearSnap() {
    clearTimeout(settleTimer);
    settleTimer = 0;
    snapPosition = null;
    userScrolling = false;
    element.dataset[stateKey] = 'idle';
  }
  function goTo(index, { instant = false } = {}) {
    clearSnap();
    snapPosition = getStops()[index];
    element.dataset[stateKey] = 'settling';
    scrollTo({ top: snapPosition, behavior: instant || isPaused() ? 'instant' : 'smooth' });
    settleTimer = setTimeout(clearSnap, 200);
  }
  function settle() {
    if (isPaused() || touching || !userScrolling || document.querySelector('dialog[open]')) return;
    const next = getExperienceSnapTarget(getStops(), scrollY, direction);
    if (next === null) clearSnap();
    else goTo(next);
  }
  function onScroll() {
    const delta = scrollY - lastY;
    lastY = scrollY;
    onPositionChange();
    clearTimeout(settleTimer);
    if (snapPosition !== null) {
      if (Math.abs(scrollY - snapPosition) <= 2) clearSnap();
      else settleTimer = setTimeout(clearSnap, 200);
    } else if (userScrolling && Math.abs(delta) > .1) {
      direction = Math.sign(delta);
      settleTimer = setTimeout(settle, 160);
    }
  }
  function onIntent() {
    if (snapPosition !== null) scrollTo({ top: scrollY, behavior: 'instant' });
    clearSnap();
    lastY = scrollY;
    userScrolling = !isPaused();
  }
  function cancel() {
    if (snapPosition !== null) scrollTo({ top: scrollY, behavior: 'instant' });
    clearSnap();
    lastY = scrollY;
  }
  addEventListener('wheel', onIntent, { passive: true });
  addEventListener('pointerdown', event => { if (event.clientX >= document.documentElement.clientWidth) onIntent(); }, { passive: true });
  addEventListener('touchstart', () => { touching = true; onIntent(); }, { passive: true });
  addEventListener('touchend', () => { touching = false; if (userScrolling) { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160); } }, { passive: true });
  addEventListener('touchcancel', () => { touching = false; clearSnap(); }, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key) && !event.target.closest('input, textarea, select, button, [contenteditable="true"]')) onIntent();
  });
  document.addEventListener('click', event => { if (event.target.closest('a[href], #motion-toggle')) clearSnap(); });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', cancel);
  clearSnap();
  return { goTo, cancel };
}

flightSnap = createSectionScrollSnap({
  element: flight,
  getStops: () => {
    const top = scrollY + flight.getBoundingClientRect().top;
    const distance = flight.offsetHeight - document.querySelector('.flight-viewport').clientHeight;
    return journeyPositions.map(progress => top + distance * progress);
  },
  isPaused: () => paused,
  stateKey: 'chapterSnap'
});

archiveInputGuard = createArchiveScrollGuard({
  getMode: delta => {
    const offset = -flight.getBoundingClientRect().top;
    const distance = journeyLength();
    return archiveScrollMode({ bypass: archiveNavigationBypass, offset, delta,
      recordStop: distance * journeyPositions[2], journeyStop: distance * journeyPositions[3],
      unlocked: archiveExitAllowed, complete: Boolean(sceneController?.canExitArchive()) });
  },
  onBlock: (delta, mode) => {
    flightSnap.cancel();
    const top = scrollY + flight.getBoundingClientRect().top;
    const distance = journeyLength();
    if (mode === 'hold') {
      const stop = top + distance * journeyPositions[2];
      if (Math.abs(scrollY - stop) > 1) scrollTo({ top: stop, behavior: 'instant' });
      sceneController?.requestArchiveReveal();
    } else {
      archiveExitAllowed = true;
      scrollTo({ top: archiveAdvanceTarget(scrollY, delta, top + distance * journeyPositions[3]), behavior: 'instant' });
    }
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.hash === '#about') return;
  // Explicit navigation to another section remains available without traversing the journey.
  returningToTop = link.getAttribute('href') === '#top';
  archiveNavigationBypass = true;
  if (!returningToTop) archiveExitAllowed = true;
  archiveNavigationArrived = false; archiveInputGuard.reset();
}, { capture: true });

function openAbout() {
  experienceMotion?.cancel();
  archiveInputGuard.reset();
  returningToTop = archiveNavigationBypass = archiveNavigationArrived = false;
  flightSnap.goTo(2, { instant: true });
  updateJourney();
  sceneController?.requestArchiveReveal({ immediate: true });
}

navigation.querySelector('[href="#about"]').addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (location.hash !== '#about') history.pushState(null, '', '#about');
  openAbout();
});
addEventListener('hashchange', () => { if (location.hash === '#about') openAbout(); });

// Dynamic import keeps navigation, project previews and content usable if WebGL/module loading fails.
const sceneReady = import('./scene.js').then(async ({ createVoyagerScene }) => {
  sceneController = await createVoyagerScene({
    mount: document.querySelector('#scene-mount'),
    viewport: document.querySelector('.flight-viewport'),
    onStatus: message => { status.textContent = message; },
    onFrame: renderChapters,
    paused
  });
  sceneController.setPaused(paused);
  if (location.hash === '#about') openAbout();
  else updateJourney();
  await new Promise(resolve => requestAnimationFrame(resolve));
}).catch(error => {
  document.body.classList.add('scene-failed');
  status.textContent = '3D UNAVAILABLE — THE ARCHIVE IS STILL OPEN';
  console.error('Voyager scene could not start:', error);
  throw error;
});
const uiReady = document.fonts.ready.then(() => { contactMap.prepare(); return experienceMotion.prepare(); });
siteLoading.run(sceneReady, uiReady);

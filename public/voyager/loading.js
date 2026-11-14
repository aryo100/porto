export async function waitForAssets(tasks, onProgress = () => {}) {
  const pending = new Set(tasks.map(task => task.label));
  let completed = 0, failed = false;
  const report = ready => onProgress({ completed, total: tasks.length, ready, failed, pending: [...pending] });
  report(false);
  try {
    await Promise.all(tasks.map(async task => {
      await task.run();
      completed++; pending.delete(task.label);
      if (!failed) report(false);
    }));
    report(true);
  } catch (error) {
    failed = true; report(false); throw error;
  }
}

export async function decodePageImages(images) {
  await Promise.all([...images].map(image => {
    image.loading = 'eager';
    return image.decode();
  }));
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

export function getRenderPixelRatio(width, height, density) {
  return Math.min(density || 1, 1.5, Math.sqrt(2_200_000 / Math.max(1, width * height)));
}

export async function prepareRenderPasses(renderer, passes, yieldFrame = nextFrame) {
  const originalTarget = renderer.getRenderTarget();
  try {
    for (const pass of passes) {
      // Render target changes tone-mapping defines: compile the variant that will actually draw.
      renderer.setRenderTarget(pass.target);
      await renderer.compileAsync(pass.scene, pass.camera);
      renderer.clear(); renderer.render(pass.scene, pass.camera);
      await yieldFrame();
    }
  } finally { renderer.setRenderTarget(originalTarget); }
}

export async function waitForGpu(renderer, yieldFrame = nextFrame) {
  const gl = renderer.getContext(), sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) throw new Error('Could not prepare the WebGL frame');
  gl.flush();
  try {
    for (;;) {
      const status = gl.clientWaitSync(sync, 0, 0);
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return;
      if (status === gl.WAIT_FAILED || renderer.getContext().isContextLost?.()) throw new Error('WebGL preparation interrupted');
      await yieldFrame();
    }
  } finally { gl.deleteSync(sync); }
}

export function createSiteLoading() {
  const screen = document.querySelector('#site-loader');
  const meter = screen.querySelector('[role="progressbar"]');
  const percent = screen.querySelector('[data-loading-percent]');
  const message = screen.querySelector('[data-loading-message]');
  const retry = screen.querySelector('[data-loading-retry]');
  const roots = [...document.querySelectorAll('.site-header, main, .skip-link, .back-to-top')];
  roots.forEach(root => { root.inert = true; });
  retry.addEventListener('click', () => location.reload());
  return {
    async run(sceneReady, uiReady = Promise.resolve()) {
      try {
        await waitForAssets([
          { label: 'Collecting memories', run: () => decodePageImages(document.images) },
          { label: 'Setting the tone', run: () => document.fonts.ready },
          { label: 'Preparing the timeline', run: () => uiReady },
          { label: 'Receiving the signal', run: () => sceneReady }
        ], state => {
          if (state.failed) return;
          const value = state.ready ? 100 : Math.min(99, Math.floor(state.completed / state.total * 100));
          percent.textContent = String(value).padStart(3, '0');
          meter.setAttribute('aria-valuenow', String(value));
          screen.style.setProperty('--loading-progress', value / 100);
          message.textContent = state.ready ? 'The archive is ready.' : `${state.pending[0] || 'One last detail'}…`;
        });
        document.body.dataset.assetsReady = 'true';
        document.body.setAttribute('aria-busy', 'false');
        document.body.classList.remove('is-loading');
        roots.forEach(root => { root.inert = false; });
        screen.classList.add('is-complete'); screen.inert = true;
        screen.setAttribute('aria-hidden', 'true');
        setTimeout(() => { screen.hidden = true; }, 450);
        return true;
      } catch (error) {
        document.body.dataset.assetsReady = 'false';
        document.body.setAttribute('aria-busy', 'false');
        screen.dataset.state = 'error';
        message.textContent = 'Some files could not arrive. Please try again.';
        retry.hidden = false;
        console.error('Archive preload failed:', error);
        return false;
      }
    }
  };
}

(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forceFx = () => (document.body && document.body.dataset && document.body.dataset.forceFx === 'true');
  if (prefersReduced && !forceFx()) return;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.id = 'fx-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#00e5ff';
  const accent2 = css.getPropertyValue('--accent2').trim() || '#00ff88';

  function hexToRgb(hex) {
    const m = hex.replace('#','').match(/.{1,2}/g);
    if (!m) return [0, 229, 255];
    return m.map(x => parseInt(x.length === 1 ? x + x : x, 16));
  }

  const c1 = hexToRgb(accent);
  const c2 = hexToRgb(accent2);

  let vw = 0, vh = 0;
  function resize() {
    vw = Math.max(1, window.innerWidth);
    vh = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const area = () => vw * vh;
  const targetCount = () => Math.max(60, Math.min(180, Math.floor(area() / 15000)));

  function rand(min, max) { return Math.random() * (max - min) + min; }

  const particles = [];
  function seedParticles() {
    particles.length = 0;
    const n = targetCount();
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * vw,
        y: Math.random() * vh,
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        r: rand(0.6, 1.8),
        glow: Math.random() < 0.5 ? c1 : c2,
        a: rand(0.25, 0.7),
      });
    }
  }
  seedParticles();
  window.addEventListener('resize', seedParticles);

  const cursor = { x: vw/2, y: vh/2, t: 0, active: false };
  window.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    cursor.t = performance.now();
    cursor.active = true;
  }, { passive: true });

  let lastTs = 0;
  function step(ts) {
    if (document.hidden) { requestAnimationFrame(step); return; }
    const dt = Math.min(50, ts - lastTs || 16);
    lastTs = ts;

    ctx.clearRect(0, 0, vw, vh);

    // subtle grid glow overlay
    const grd = ctx.createLinearGradient(0, 0, vw, vh);
    grd.addColorStop(0, 'rgba(0, 229, 255, 0.05)');
    grd.addColorStop(1, 'rgba(0, 255, 136, 0.04)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, vw, vh);

    // particles
    ctx.globalCompositeOperation = 'lighter';
    for (let p of particles) {
      p.x += p.vx * (dt * 0.06);
      p.y += p.vy * (dt * 0.06);
      if (p.x < -10) p.x = vw + 10; else if (p.x > vw + 10) p.x = -10;
      if (p.y < -10) p.y = vh + 10; else if (p.y > vh + 10) p.y = -10;

      const [r, g, b] = p.glow;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.a})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // cursor glow
    const now = performance.now();
    const activeAge = now - cursor.t;
    const visible = cursor.active && activeAge < 2000;
    if (visible) {
      const base = Math.max(80, Math.min(180, 180 - activeAge * 0.05));
      const grad = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, base);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
      grad.addColorStop(0.5, 'rgba(0, 255, 136, 0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, base, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(step);
  }

  window.__fxReady = true;
  requestAnimationFrame(step);
})();



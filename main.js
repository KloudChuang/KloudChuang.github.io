/* ===== Year ===== */
document.getElementById('year').textContent = new Date().getFullYear();

/* ===== Reveal on scroll ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  io.observe(el);
});

/* ===== Live denoising text demo (Meta-DiffuB) ===== */
(() => {
  const el = document.getElementById('denoiseText');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = ['contextualized', 'meta-exploration', 'diffusion', 'generation'];
  const glyphs = '▚▞▜▛░▒▓#@%&$/\\|<>=+*ξλβθ01';
  const rnd = (s) => glyphs[Math.floor(Math.random() * glyphs.length)] ;
  let ti = 0;

  if (reduce) { el.textContent = targets[0]; return; }

  function denoiseTo(word, done) {
    const len = word.length;
    let frame = 0;
    const total = 32; // frames of reverse diffusion
    const id = setInterval(() => {
      frame++;
      // noise level decreases as frame grows (reverse diffusion: noisy -> clean)
      const clean = frame / total;
      let out = '';
      for (let k = 0; k < len; k++) {
        // each char "settles" at a slightly different step (contextualized schedule)
        const settle = (k / len) * 0.4 + 0.3;
        out += clean > settle ? word[k] : rnd();
      }
      el.textContent = out;
      if (frame >= total) {
        clearInterval(id);
        el.textContent = word;
        setTimeout(done, 1100);
      }
    }, 55);
  }

  function loop() {
    denoiseTo(targets[ti], () => {
      ti = (ti + 1) % targets.length;
      loop();
    });
  }
  loop();
})();

/* ===== Flowing particle field background ===== */
(() => {
  const canvas = document.getElementById('flow');
  if (!canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d');
  let w, h, dpr, particles, t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.min(140, Math.floor((innerWidth * innerHeight) / 14000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: (Math.random() * 1.2 + 0.4) * dpr,
    }));
  }

  // pseudo flow-field angle from position + time (no external noise lib)
  function field(x, y) {
    const nx = x * 0.0016, ny = y * 0.0016;
    return (
      Math.sin(nx + t * 0.0003) +
      Math.cos(ny - t * 0.00025) +
      Math.sin((nx + ny) * 0.8 + t * 0.0002)
    ) * 1.4;
  }

  const palette = ['rgba(124,92,255,', 'rgba(34,211,238,', 'rgba(244,114,182,'];

  function step() {
    t++;
    ctx.fillStyle = 'rgba(6,7,13,0.10)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = field(p.x, p.y);
      p.x += Math.cos(a) * 0.9 * dpr;
      p.y += Math.sin(a) * 0.9 * dpr;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      const col = palette[i % palette.length];
      ctx.fillStyle = col + '0.55)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }

  addEventListener('resize', resize);
  resize();
  step();
})();

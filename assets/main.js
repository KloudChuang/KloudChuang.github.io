/* =========================================================================
   main.js — instrument behaviours
   ========================================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- year ---- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- reveal on scroll (with failsafes so content never stays hidden) ---- */
  var revIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  reveals.forEach(function (el) { revIO.observe(el); });

  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('in');
    });
  }
  function showAllInstant() {
    document.documentElement.classList.add('reveal-now');
    reveals.forEach(function (el) { el.classList.add('in'); });
  }
  // If the tab is hidden, transitions freeze at opacity:0 — show instantly instead.
  if (document.hidden) { showAllInstant(); }
  else { revealInView(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) revealInView(); });
  window.addEventListener('load', revealInView);
  // hard failsafe: never leave content hidden
  setTimeout(showAllInstant, 2600);

  /* ---- top scan bar + readout ---- */
  var scan = document.getElementById('scan');
  var roSect = document.getElementById('roSect');
  var roPct = document.getElementById('roPct');
  var sects = Array.prototype.slice.call(document.querySelectorAll('[data-sect]'));

  function onScroll() {
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? st / h : 0;
    if (scan) scan.style.width = (pct * 100).toFixed(2) + '%';
    if (roPct) roPct.textContent = String(Math.round(pct * 100)).padStart(3, '0');

    var probe = st + window.innerHeight * 0.35;
    var cur = sects[0];
    for (var i = 0; i < sects.length; i++) {
      if (sects[i].offsetTop <= probe) cur = sects[i];
    }
    if (cur && roSect) roSect.textContent = cur.getAttribute('data-sect');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---- scrollytelling: steps drive viz stage ---- */
  var captions = {
    diffub: [
      'DiffuSeq imposes <b>one fixed noise schedule</b> on every sentence — regardless of difficulty.',
      'The scheduler reads wˣ and emits <b>Meta-Instructions ι</b> — a True/False skip sequence.',
      '‘skipping’ bends the √-baseline into a <b>contextualized βˣ</b> — less noise for hard sentences.',
      'The exploiter denoises with βˣ, then <b>rounds z₀</b> back into a discrete sentence ŷ.',
      'BLEU before vs. after → <b>meta-reward R_β = r′ − r</b> → policy gradient trains the scheduler.',
      '<b>State of the art</b> on 4 Seq2Seq benchmarks · the scheduler is plug-and-play.'
    ],
    gan: [
      'A classic Language GAN: one <b>Generator both samples and learns</b> — sparse reward, weak diversity.',
      'MetaEx-GAN adds a meta-trained <b>Explorer</b> — a teacher dedicated to sampling.',
      'The explorer rolls out a <b>diverse batch</b>, reaching states the generator wouldn\u2019t.',
      'The generator learns; the <b>Discriminator</b> scores real vs. fake and returns a reward.',
      'The student\u2019s <b>learning effectiveness</b> becomes the meta-reward that trains the explorer.',
      '<b>Quality + diversity together</b> · state-of-the-art NLG · generalizes to GPT-2.'
    ],
    qmv: [
      'Multiview detection fuses many cameras onto one ground plane — but <b>weighting them equally</b> ignores occlusion.',
      'A 2D <b>detection-by-tracking</b> network (FairMOT) anchors reliable 2D foot points.',
      'Each view is projected to the ground plane and encoded by a <b>deformable transformer</b>.',
      '<b>2D–3D consistency</b> — small reprojection discrepancy means a reliable camera (attention Ac).',
      'A <b>QBL scheduler</b> aggregates cameras by Ac, guiding learning only when the weight order shifts.',
      '<b>State of the art</b> MODA · Wildtrack 93.1% · MultiviewX 95.1%.'
    ],
    rap: [
      'SeqGAN rolls out <b>entire sentences</b> by MCTS at every step — expensive, prone to mode collapse.',
      'PRO segments each line into <b>meaningful phrases</b> via TextRank — ρ′(y) = (p₁…p_T′).',
      'Roll out only to the <b>phrase boundary t′_end</b> — streamlined and still meaningful.',
      'AREGS uses an <b>attention-LSTM</b>: α = softmax(wᵀ·tanh(H)) over the sequence.',
      'Reward by <b>cosine similarity S(α*, α̂)</b> — feature matching prevents mode collapse.',
      '<b>State-of-the-art RLG</b> on diversity · originality · fluency + a 160k-song dataset.'
    ],
    sos: [
      'A first-in-first-out feed lets <b>support-seeking posts cluster</b> — overwhelming the reader.',
      'Label boards (Prozac/Hate = overload) and embed words with <b>Word2vec Skip-Gram</b>.',
      '<b>CKDGNN</b> — CNN → K-max pool (doc) → GRNN — detects overload at <b>95.15%</b> accuracy.',
      'Score every post; anything above the <b>0.5 threshold</b> is flagged social-overload.',
      'SOS rearranges: <b>max 3 consecutive</b> overload posts, inserting a calm post to break streaks.',
      '<b>95.15% detection</b> · <b>75%</b> of readers reported reduced social-overload stress.'
    ]
  };
  var vizMap = {
    diffub: { viz: document.getElementById('vizDiffub'), cap: document.getElementById('capDiffub') },
    gan: { viz: document.getElementById('vizGan'), cap: document.getElementById('capGan') },
    qmv: { viz: document.getElementById('vizQmv'), cap: document.getElementById('capQmv') },
    rap: { viz: document.getElementById('vizRap'), cap: document.getElementById('capRap') },
    sos: { viz: document.getElementById('vizSos'), cap: document.getElementById('capSos') }
  };

  function setStage(key, stage) {
    var m = vizMap[key];
    if (!m || !m.viz) return;
    if (m.viz.getAttribute('data-stage') === String(stage)) return;
    m.viz.setAttribute('data-stage', String(stage));
    if (m.cap && captions[key]) m.cap.innerHTML = captions[key][stage];
    var bars = m.viz.querySelectorAll('.stage-bars i');
    bars.forEach(function (b, i) { b.classList.toggle('on', i <= stage); });
  }

  document.querySelectorAll('[data-steps]').forEach(function (col) {
    var key = col.getAttribute('data-steps');
    var steps = Array.prototype.slice.call(col.querySelectorAll('.step'));
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove('is-active'); });
          e.target.classList.add('is-active');
          setStage(key, parseInt(e.target.getAttribute('data-stage'), 10));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { stepIO.observe(s); });
  });

  /* ---- denoising text (Meta-DiffuB step 03) ---- */
  (function () {
    var el = document.getElementById('diffubDenoise');
    if (!el || reduce) { if (el) el.textContent = 'generation'; return; }
    var words = ['contextualized', 'meta-reward', 'diffusion', 'generation'];
    var glyphs = '\u2592\u2591\u2593#%&$/\\|<>=+*\u03be\u03bb\u03b2\u03b801';
    var wi = 0;
    function rnd() { return glyphs[(Math.random() * glyphs.length) | 0]; }
    function run(word, done) {
      var len = word.length, frame = 0, total = 30;
      var id = setInterval(function () {
        frame++;
        var clean = frame / total, out = '';
        for (var k = 0; k < len; k++) {
          var settle = (k / len) * 0.45 + 0.28;
          out += clean > settle ? word[k] : rnd();
        }
        el.textContent = out;
        if (frame >= total) { clearInterval(id); el.textContent = word; setTimeout(done, 1200); }
      }, 55);
    }
    function loop() { run(words[wi], function () { wi = (wi + 1) % words.length; loop(); }); }
    loop();
  })();

  /* ---- hero live β-trace ---- */
  (function () {
    var path = document.getElementById('scopeBeta');
    var val = document.getElementById('scopeVal');
    if (!path) return;
    if (reduce) { return; }
    var N = 22, x0 = 6, x1 = 234, t = 0;
    function frame() {
      t += 0.02;
      var d = '', lastBeta = 0;
      for (var i = 0; i <= N; i++) {
        var u = i / N;
        var x = x0 + (x1 - x0) * u;
        // rising sqrt-like schedule with a wandering contextual wobble
        var sched = Math.sqrt(u);
        var wobble = 0.10 * Math.sin(u * 6.0 + t) + 0.06 * Math.sin(u * 13.0 - t * 1.7);
        var b = Math.max(0, Math.min(1, sched + wobble));
        lastBeta = b;
        var y = 82 - 56 * b;
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
      }
      path.setAttribute('d', d.trim());
      if (val) val.textContent = 'β=' + lastBeta.toFixed(3);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---- mobile nav dropdown ---- */
  (function () {
    var nav = document.querySelector('.topnav');
    var btn = nav && nav.querySelector('.nav-toggle');
    var links = nav && nav.querySelector('.navlinks');
    if (!nav || !btn || !links) return;
    function close() { nav.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 620) close(); });
  })();
})();

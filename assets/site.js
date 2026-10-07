try {
/* Theme switch: follows the system until the visitor chooses; the choice is remembered */
(() => {
  const root = document.documentElement, btn = document.getElementById('theme');
  if (!btn) return;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let chosen = null;
  try { const v = localStorage.getItem('theme'); if (v === 'dark' || v === 'light') chosen = v; } catch (e) {}
  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Helles Design einschalten' : 'Dunkles Design einschalten');
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || (dark ? '#0d0d11' : '#ffffff');
  };
  const apply = t => { root.dataset.theme = t; sync(); };
  if (root.dataset.theme !== 'dark' && root.dataset.theme !== 'light') root.dataset.theme = chosen || (mq.matches ? 'dark' : 'light');
  sync();
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    chosen = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    if (reduce.matches) { apply(next); return; }
    if (document.startViewTransition) {
      const vt = document.startViewTransition(() => apply(next));
      vt.ready.then(() => {
        /* both directions: the new look cross-fades calmly over the old one */
        root.animate({ opacity: [0, 1] },
          { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
      return;
    }
    root.classList.add('theme-fade');
    apply(next);
    setTimeout(() => root.classList.remove('theme-fade'), 450);
  });
  const onSystem = () => { if (!chosen) apply(mq.matches ? 'dark' : 'light'); };
  mq.addEventListener ? mq.addEventListener('change', onSystem) : mq.addListener(onSystem);
})();
} catch (e) { console.error(e); }
try {
(() => {
  const stack = document.getElementById('photo-swap');
  if (!stack) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false, hopTimer = 0;
  const HOP_EVERY = 20000;
  // Alle 20 s hüpft das hintere Foto kurz, als Hinweis, dass man tauschen kann.
  const hop = () => {
    const back = stack.querySelector('.photo.is-back');
    if (busy || reduce || document.hidden || !back || !back.animate) return;
    // additiv: der Hüpfer legt sich auf den aktuellen Zustand (auch auf den Hover-Versatz), ohne Sprung
    back.animate(
      [{ transform: 'translate(0,0) rotate(0deg)', easing: 'cubic-bezier(.3,.7,.4,1)' },
       { transform: 'translate(7%, -9%) rotate(3.5deg)', offset: .22, easing: 'cubic-bezier(.5,0,.7,.4)' },
       { transform: 'translate(0,0) rotate(0deg)', offset: .46, easing: 'cubic-bezier(.3,.7,.4,1)' },
       { transform: 'translate(3.5%, -4.5%) rotate(1.7deg)', offset: .64, easing: 'cubic-bezier(.5,0,.7,.4)' },
       { transform: 'translate(0,0) rotate(0deg)', offset: .84 },
       { transform: 'translate(0,0) rotate(0deg)' }],
      { duration: 1100, composite: 'add' });
  };
  const armHop = () => { clearInterval(hopTimer); if (!reduce) hopTimer = setInterval(hop, HOP_EVERY); };
  armHop();
  stack.addEventListener('click', () => {
    if (busy) return;
    armHop();
    const back = stack.querySelector('.photo.is-back');
    const front = stack.querySelector('.photo.is-front');
    const swap = () => {
      back.classList.replace('is-back', 'is-front');
      front.classList.replace('is-front', 'is-back');
    };
    if (reduce || !back.animate) { swap(); return; }
    busy = true;
    // Start und Ende laufen vom bzw. zum echten CSS-Zustand (inklusive Hover-Versatz),
    // damit weder am Anfang noch am Ende etwas springt.
    const from = [getComputedStyle(back).transform, getComputedStyle(front).transform].map(t => t === 'none' ? 'translate(0,0)' : t);
    back.getAnimations().forEach(a => a.cancel());
    back.style.transition = front.style.transition = 'none';
    const AWAY = 'translate(58%, -8%) rotate(7deg)', DOWN = 'scale(.965) translate(-3%, 1.5%)';
    const E1 = 'cubic-bezier(.45,.05,.35,1)', E2 = 'cubic-bezier(.22,.9,.3,1)';
    const out1 = back.animate([{ transform: from[0] }, { transform: AWAY }], { duration: 460, easing: E1, fill: 'forwards' });
    const out2 = front.animate([{ transform: from[1] }, { transform: DOWN }], { duration: 460, easing: E1, fill: 'forwards' });
    out1.onfinish = () => {
      swap();
      // nur der Start ist festgelegt; das Ziel ist der jeweilige CSS-Zustand
      const in1 = back.animate([{ transform: AWAY, offset: 0 }], { duration: 620, easing: E2 });
      front.animate([{ transform: DOWN, offset: 0 }], { duration: 620, easing: E2 });
      out1.cancel(); out2.cancel();
      in1.onfinish = () => { back.style.transition = front.style.transition = ''; busy = false; };
    };
  });
})();
} catch (e) { console.error(e); }
try {
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const blobs = [
    { el: hero.querySelector('.blob--pink'),   rest: [1.03, 0.45], k: 0.32 },
    { el: hero.querySelector('.blob--orange'), rest: [0.45, 1.14], k: 0.16 }
  ];
  blobs.forEach(b => { b.x = 0; b.y = 0; b.tx = 0; b.ty = 0; });
  let raf = 0;
  const tick = () => {
    let moving = false;
    for (const b of blobs) {
      b.x += (b.tx - b.x) * 0.08;
      b.y += (b.ty - b.y) * 0.08;
      if (Math.abs(b.tx - b.x) > 0.1 || Math.abs(b.ty - b.y) > 0.1) moving = true;
      b.el.style.translate = b.x.toFixed(2) + 'px ' + b.y.toFixed(2) + 'px';
    }
    raf = moving ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  hero.addEventListener('pointermove', e => {
    if (!fine.matches || reduce.matches || hero.classList.contains('has-fluid')) return;
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    for (const b of blobs) {
      b.tx = (px - b.rest[0]) * r.width * b.k;
      b.ty = (py - b.rest[1]) * r.height * b.k;
    }
    kick();
  });
  hero.addEventListener('pointerleave', () => {
    for (const b of blobs) { b.tx = 0; b.ty = 0; }
    kick();
  });
})();
} catch (e) { console.error(e); }
try {
/* Hero: liquid gradient. A WebGL shader warps the colour field so it flows like paint in water; the cursor (or a finger moving
   sideways) stirs it and leaves swirls that fade. Without WebGL the CSS gradient with its drifting blobs stays as it is.
   Pauses off screen and in a hidden tab; under reduced motion it is a single still frame. */
(() => {
  const hero = document.querySelector('.hero');
  const cv = hero && hero.querySelector('.hero__fluid');
  if (!cv || !cv.getContext) return;
  const tile = hero.closest('.tile') || hero;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const K = 8, P = new Float32Array(K * 3), V = new Float32Array(K * 2);   // the last stirs: position + strength, direction
  let gl = null, uR, uT, uP, uV, W = 0, H = 0, S = 0;
  let head = 0, lastX = -1e4, lastY = 0, plx = 0, ply = 0, plt = 0, visible = false, raf = 0, last = 0, skip = false, greeted = false;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R; uniform float T; uniform vec3 P[${K}]; uniform vec2 V[${K}];
float hash(vec2 p){ vec3 a = fract(vec3(p.xyx) * .1031); a += dot(a, a.yzx + 33.33); return fract((a.x + a.y) * a.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / R; uv.y = 1. - uv.y;
  vec2 p = uv;
  /* stirs: each pushes the field along its direction and twists it around its centre */
  for (int i = 0; i < ${K}; i++) { vec2 d = p - P[i].xy; float g = exp(-dot(d, d) / .02) * P[i].z; p -= V[i] * g * .2; p += vec2(-d.y, d.x) * g * 1.1; }
  float t = T * .05;
  vec2 q = vec2(fbm(p * 1.7 + vec2(0., t)), fbm(p * 1.7 + vec2(5.2, -t * 1.3)));
  vec2 r = vec2(fbm(p * 1.5 + 2.4 * q + vec2(1.7, 9.2) + .6 * t), fbm(p * 1.5 + 2.4 * q + vec2(8.3, 2.8) - .5 * t));
  vec2 w = p + (r - .5) * .9 + (q - .5) * .25;
  /* the same layout as the CSS gradient: blue base, pink from the top right, orange from the bottom left */
  float pink = smoothstep(1.02, .3, length((w - vec2(1.03, .42)) / vec2(.98, .98)));
  float orange = smoothstep(1., .45, length((w - vec2(.42, 1.14)) / vec2(.88, .74)));
  vec3 col = mix(vec3(0., .09, .6), vec3(0., .15, 1.), smoothstep(.15, .9, w.x * .45 + (1. - w.y) * .55));
  col = mix(col, vec3(.94, .08, .5), pink);
  col = mix(col, vec3(1., .42, 0.), orange);
  col += (hash(gl_FragCoord.xy + fract(T) * 61.) - .5) * .045;   // fine grain
  gl_FragColor = vec4(col, 1.);
}`;
  const init = () => {
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false }) || cv.getContext('experimental-webgl', { antialias: false, alpha: false }); } catch (e) { gl = null; }
    if (!gl) return false;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS), prog = gl.createProgram();
    if (!vs || !fs) { gl = null; return false; }
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uR = gl.getUniformLocation(prog, 'R'); uT = gl.getUniformLocation(prog, 'T'); uP = gl.getUniformLocation(prog, 'P'); uV = gl.getUniformLocation(prog, 'V');
    hero.classList.add('has-fluid');
    return true;
  };
  const size = () => {
    const r = hero.getBoundingClientRect(); if (!r.width) return;
    W = r.width; H = r.height; S = Math.min(W, H);
    const d = Math.min(window.devicePixelRatio || 1, 1.5), w = Math.round(W * d), h = Math.round(H * d);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    draw(performance.now());
  };
  const draw = now => {
    if (!gl) return;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, reduce.matches ? 40 : (now / 1000) % 3600);
    gl.uniform3fv(uP, P); gl.uniform2fv(uV, V);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = now => {
    raf = 0;
    if (!gl || !visible || document.hidden) return;
    const dt = Math.min(64, now - (last || now)); last = now;
    let active = 0; const f = Math.exp(-dt / 1100);
    for (let i = 0; i < K; i++) { P[i * 3 + 2] *= f; if (P[i * 3 + 2] > active) active = P[i * 3 + 2]; }
    skip = active < .02 && !skip;          // nothing is being stirred: the slow drift only needs every other frame
    if (!skip) draw(now);
    if (!reduce.matches) raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && gl && visible && !reduce.matches) { last = 0; raf = requestAnimationFrame(loop); } };
  const stir = (x, y, vx, vy, s) => { P[head * 3] = x / W; P[head * 3 + 1] = y / H; P[head * 3 + 2] = s; V[head * 2] = vx; V[head * 2 + 1] = vy; head = (head + 1) % K; start(); };

  const pos = e => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  tile.addEventListener('pointermove', e => {
    if (!gl || reduce.matches) return;
    const [x, y] = pos(e), now = performance.now(), dt = Math.max(1, now - plt), vx = (x - plx) / dt, vy = (y - ply) / dt;
    plx = x; ply = y; plt = now;
    if (lastX < -1e3) { lastX = x; lastY = y; return; }
    if (Math.hypot(x - lastX, y - lastY) < S * .05) return;        // one stir every few per cent of the tile, not per event
    const sp = Math.hypot(vx, vy) || 1, k = Math.max(.2, Math.min(1, sp / 1.2));
    stir(x, y, vx / sp * k, vy / sp * k, k); lastX = x; lastY = y;
  });
  const leave = () => { lastX = -1e4; };
  tile.addEventListener('pointerleave', leave);
  tile.addEventListener('pointercancel', leave);
  tile.addEventListener('pointerdown', e => {
    if (!gl || reduce.matches) return;
    const [x, y] = pos(e); plx = x; ply = y; plt = performance.now(); lastX = x; lastY = y;
    stir(x, y, 0, 0, 1);                                            // a click or tap drops a swirl
  });
  tile.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') leave(); });

  if (!init()) return;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; hero.classList.remove('has-fluid'); });
  cv.addEventListener('webglcontextrestored', () => { if (init()) { size(); start(); } });
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(hero); else addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(en => {
      visible = en[0].isIntersecting;
      if (visible) { start(); if (!greeted && !reduce.matches) { greeted = true; setTimeout(() => stir(W * .5, H * .5, 0, 0, .9), 500); } }
    }, { threshold: 0.1 }).observe(hero);
  } else { visible = true; start(); }
  document.addEventListener('visibilitychange', start);
  reduce.addEventListener && reduce.addEventListener('change', () => { draw(performance.now()); start(); });
})();
} catch (e) { console.error(e); }
try {
(() => {
  const icon = document.getElementById('kadenz-icon');
  if (!icon) return;
  const link = icon.closest('a');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* Grainy blur: a small "blur map" (N x N) lives in icon space. The cursor paints into it, a shader turns it
     into a soft, noisy edge. It stays until a click, or 20 seconds without painting, sets the icon back to its clean start. */
  const fx = (() => {
    const canvas = icon.querySelector('canvas'), N = 48, EXT = 2.2;
    const field = new Float32Array(N * N), bytes = new Uint8Array(N * N);
    let gl = null, uS, uG, uR, raf = 0, last = 0, healing = false, peak = 0, auto = 0;
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = `precision highp float;
uniform float S, G; uniform vec2 R; uniform sampler2D F;
float box(vec2 p, float h, float r){ vec2 q = abs(p) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float hash(vec2 p){ vec3 a = fract(vec3(p.xyx) * .1031); a += dot(a, a.yzx + 33.33); return fract((a.x + a.y) * a.z); }
void main(){
  vec2 p = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y), l = p - R * .5;
  float d = box(l, S * .5, S * .2727);
  float b = texture2D(F, p / R).r * S * .38;
  float k = smoothstep(.5, 4., b);
  float cov = mix(clamp(.5 - d, 0., 1.), 1. - smoothstep(-b, b, d), k);
  vec2 c = floor(p / G);
  float n1 = hash(c), n2 = hash(c + 71.3);
  float hi = .25 * smoothstep(-.06 * S, .012 * S, box(l - vec2(.003, .021) * S, S * .5, S * .2727));
  float tone = n1 * .75;
  vec3 col = mix(mix(vec3(.098, 0., .851), vec3(1.), hi), vec3(.051, .004, .408), tone);
  float a = cov * mix(.8, 1., tone);
  a = min(1., a * mix(1., .45 + 1.1 * n2, k * (1. - cov * cov)));
  gl_FragColor = vec4(col * a, a);
}`;
    const init = () => {
      try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false }); } catch (e) { gl = null; }
      if (!gl) return false;
      const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uS = gl.getUniformLocation(prog, 'S'); uG = gl.getUniformLocation(prog, 'G'); uR = gl.getUniformLocation(prog, 'R');
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      icon.classList.add('has-fx');
      return true;
    };
    const draw = () => {
      if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.max(2, Math.round(canvas.clientWidth * dpr));
      if (canvas.width !== px) { canvas.width = canvas.height = px; }
      gl.viewport(0, 0, px, px);
      gl.uniform1f(uS, px / EXT); gl.uniform1f(uG, 1); gl.uniform2f(uR, px, px);
      peak = 0;
      for (let i = 0; i < field.length; i++) { const v = field[i]; if (v > peak) peak = v; bytes[i] = v >= 1 ? 255 : v * 255; }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, N, N, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = now => {
      const dt = Math.min(64, now - (last || now)); last = now;
      if (healing) { const f = Math.exp(-dt / 110); for (let i = 0; i < field.length; i++) field[i] = field[i] < .004 ? 0 : field[i] * f; }
      draw();
      if (healing && peak > 0) raf = requestAnimationFrame(tick); else { healing = false; raf = 0; last = 0; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const reset = instant => { clearTimeout(auto); if (!gl) return; if (instant) field.fill(0); healing = true; kick(); };
    /* nx, ny: position in icon units (0 = centre, +-.5 = edges); amount 0..1 */
    const paint = (nx, ny, amount) => {
      if (!gl || !(amount > 0)) return;
      healing = false;
      clearTimeout(auto); auto = setTimeout(() => reset(reduce.matches), 20000);
      const cx = (nx / EXT + .5) * N - .5, cy = (ny / EXT + .5) * N - .5, sig = .3 / EXT * N, r = Math.ceil(sig * 3);
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(N - 1, Math.ceil(cy + r)); y++)
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(N - 1, Math.ceil(cx + r)); x++) {
          const g = Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (2 * sig * sig)), i = y * N + x;
          field[i] = Math.min(1, field[i] + amount * g);
        }
      kick();
    };
    const fill = fn => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) field[y * N + x] = Math.max(0, Math.min(1, fn(((x + .5) / N - .5) * EXT, ((y + .5) / N - .5) * EXT))); draw(); };
    if (init()) {
      draw();
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; icon.classList.remove('has-fx'); });
      canvas.addEventListener('webglcontextrestored', () => { if (init()) draw(); });
      window.addEventListener('resize', () => { if (!raf) draw(); });
    }
    return { paint, fill, reset };
  })();
  window.kadenzIcon = fx;

  let x = 0, y = 0, vx = 0, vy = 0, rot = 0, scale = 1;
  let dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0, lx = 0, ly = 0, lt = 0, raf = 0, hx = null, hy = 0;
  const render = () => { icon.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`; };
  /* client position -> icon units, undoing the drag offset, tilt and scale */
  const local = (cx, cy) => {
    const r = link.getBoundingClientRect(), s = icon.offsetWidth || 1, a = -rot * Math.PI / 180;
    const dx = (cx - r.left - r.width / 2 - x) / scale, dy = (cy - r.top - r.height / 2 - y) / scale;
    return [(dx * Math.cos(a) - dy * Math.sin(a)) / s, (dx * Math.sin(a) + dy * Math.cos(a)) / s, s];
  };
  const spring = () => {
    // spring back to rest
    const k = 0.09, d = 0.78;
    vx = (vx + -x * k) * d; vy = (vy + -y * k) * d;
    x += vx; y += vy;
    rot += (Math.max(-14, Math.min(14, vx * 0.6)) - rot) * 0.2;
    scale += (1 - scale) * 0.2;
    render();
    if (Math.abs(x) + Math.abs(y) + Math.abs(vx) + Math.abs(vy) + Math.abs(rot) > 0.05) raf = requestAnimationFrame(spring);
    else { x = y = vx = vy = rot = 0; scale = 1; icon.style.transform = ''; raf = 0; }
  };
  icon.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    cancelAnimationFrame(raf); raf = 0;
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY; ox = x; oy = y; lx = e.clientX; ly = e.clientY; lt = performance.now();
    icon.setPointerCapture(e.pointerId);
    icon.classList.add('is-dragging');
  });
  icon.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 4) moved = true;
    const step = Math.hypot(e.clientX - lx, e.clientY - ly);
    x = ox + dx; y = oy + dy;
    const now = performance.now(), dt = Math.max(1, now - lt);
    vx = (e.clientX - lx) / dt * 16; vy = (e.clientY - ly) / dt * 16;
    // dragging smears the side the icon is moving away from
    if (step > 0) { const [nx, ny, s] = local(e.clientX, e.clientY), a = -rot * Math.PI / 180, ux = (e.clientX - lx) / step, uy = (e.clientY - ly) / step;
      fx.paint(nx - (ux * Math.cos(a) - uy * Math.sin(a)) * .42, ny - (ux * Math.sin(a) + uy * Math.cos(a)) * .42, step / s * 1.1); }
    lx = e.clientX; ly = e.clientY; lt = now;
    rot += (Math.max(-14, Math.min(14, vx * 0.8)) - rot) * 0.25;
    scale = 1.06;
    render();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    icon.classList.remove('is-dragging');
    if (reduce.matches) { x = y = vx = vy = rot = 0; scale = 1; icon.style.transform = ''; return; }
    raf = requestAnimationFrame(spring);
  };
  icon.addEventListener('pointerup', release);
  icon.addEventListener('pointercancel', release);
  /* moving the cursor across the tile brushes blur and grain onto the icon */
  link.addEventListener('pointermove', e => {
    if (dragging) return;
    if (hx !== null) { const step = Math.hypot(e.clientX - hx, e.clientY - hy); if (step > 0 && step < 200) { const [nx, ny, s] = local(e.clientX, e.clientY); fx.paint(nx, ny, step / s * 1.5); } }
    hx = e.clientX; hy = e.clientY;
  });
  link.addEventListener('pointerleave', () => { hx = null; });
  /* a click (without dragging) puts the icon back to its clean start and opens it large in the logo overlay */
  let keyed = false;   // was the click started from the keyboard (Enter / Space) rather than by mouse or finger?
  link.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') keyed = true; });
  link.addEventListener('pointerdown', () => { keyed = false; });
  link.addEventListener('click', e => {
    e.preventDefault(); if (moved) { moved = false; return; }
    hx = null; fx.reset(reduce.matches);
    document.dispatchEvent(new CustomEvent('kadenz:logo', { detail: { keyboard: keyed } })); keyed = false;
  });
})();
} catch (e) { console.error(e); }
try {
(() => {
  const tile = document.getElementById('covers');
  if (!tile) return;
  const covers = [...tile.querySelectorAll('.cover')], n = covers.length, label = document.getElementById('covers-now'), labelText = label.querySelector('.covers__text');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const STEP = 28 * Math.PI / 180;            // angle between two covers on the wheel
  let a = 0, from = 0, target = 0, t0 = 0, raf = 0, lastFront = 0, swap = 0;
  const mod = v => ((v % n) + n) % n;
  const rel = i => { let r = (i - a) % n; if (r < -n / 2) r += n; if (r >= n / 2) r -= n; return r; };
  const layout = () => {
    const R = tile.clientWidth;                 // wheel radius = tile width; its centre sits below the front cover
    covers.forEach((c, i) => {
      const r = rel(i), th = r * STEP, shown = Math.abs(r) < 2.5;
      c.style.visibility = shown ? '' : 'hidden';
      if (!shown) return;
      c.style.transform = `translate(${(Math.sin(th) * R).toFixed(1)}px, ${((1 - Math.cos(th)) * R).toFixed(1)}px) rotate(${(th * 180 / Math.PI).toFixed(2)}deg)`;
      c.style.zIndex = 10 - Math.round(Math.abs(r) * 2);
    });
  };
  const state = () => {
    const f = mod(target);
    covers.forEach((c, i) => {
      const d = Math.abs(((i - f + n + n / 2) % n) - n / 2), name = c.dataset.name;
      c.classList.toggle('is-front', i === f);
      c.tabIndex = d <= 1 ? 0 : -1;
      c.setAttribute('aria-label', i === f ? `Playlist „${name}“ ist vorne. Nächstes Cover zeigen` : `Playlist „${name}“ nach vorne holen`);
    });
    if (f !== lastFront) {
      lastFront = f; clearTimeout(swap);
      label.href = 'https://open.spotify.com/playlist/' + covers[f].dataset.spotify;
      label.setAttribute('aria-label', `Playlist „${covers[f].dataset.name}“ in Spotify öffnen (neuer Tab)`);
      if (reduce.matches) { labelText.textContent = covers[f].dataset.name; return; }
      label.classList.add('is-changing');
      swap = setTimeout(() => { labelText.textContent = covers[f].dataset.name; label.classList.remove('is-changing'); }, 200);
    }
  };
  const tick = t => {
    const p = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - p, 3);
    a = from + (target - from) * e; layout();
    raf = p < 1 ? requestAnimationFrame(tick) : 0;
  };
  const turn = by => {
    target += by; from = a; t0 = performance.now(); state();
    if (reduce.matches) { a = target; layout(); } else if (!raf) raf = requestAnimationFrame(tick);
  };
  /* swipe: the wheel follows the finger (or a mouse drag) sideways; letting go snaps to the nearest cover, a flick carries it
     further. Vertical movement stays page scrolling (touch-action: pan-y on the tile). */
  let drag = null, swiped = false;
  const stepPx = () => Math.sin(STEP) * tile.clientWidth;     // finger travel that moves the front cover onto its neighbour
  const settle = to => {
    target = to; from = a; t0 = performance.now(); state();
    if (reduce.matches) { a = target; layout(); } else if (!raf) raf = requestAnimationFrame(tick);
  };
  tile.addEventListener('pointerdown', e => {
    swiped = false;
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.covers__name')) return;
    drag = { id: e.pointerId, x0: e.clientX, a0: a, on: false, x: e.clientX, t: e.timeStamp, v: 0 };
  });
  tile.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!drag.on) {
      if (Math.abs(dx) < 8) return;
      drag.on = swiped = true; drag.a0 = a; drag.x0 = e.clientX;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      try { tile.setPointerCapture(e.pointerId); } catch (err) {}
      tile.classList.add('is-dragging');
      return;
    }
    const dt = e.timeStamp - drag.t;
    if (dt > 0) drag.v = .7 * ((e.clientX - drag.x) / dt) + .3 * drag.v;   // px per ms, smoothed
    drag.x = e.clientX; drag.t = e.timeStamp;
    a = drag.a0 - dx / stepPx(); layout();
    const near = Math.round(a);
    if (near !== target) { target = near; state(); }
  });
  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.on) return;
    tile.classList.remove('is-dragging');
    const v = e.type === 'pointerup' && e.timeStamp - d.t < 80 ? d.v : 0;      // a pause before lifting is no flick
    let to = Math.round(a - v * 180 / stepPx());
    if (to === Math.round(d.a0) && Math.abs(a - d.a0) > .18) to += a > d.a0 ? 1 : -1;   // a short, clear swipe still moves one cover
    settle(Math.max(Math.round(d.a0) - 3, Math.min(Math.round(d.a0) + 3, to)));
  };
  tile.addEventListener('pointerup', release);
  tile.addEventListener('pointercancel', release);
  /* every click on the tile turns the wheel one cover further; only the cover on the left turns it back */
  tile.addEventListener('click', e => {
    if (swiped) { swiped = false; e.preventDefault(); return; }   // that was a swipe, not a tap
    if (e.target.closest('.covers__name')) return;   // the name pill is a link to the playlist on Spotify
    const c = e.target.closest('.cover');
    turn(c && covers.indexOf(c) === mod(target - 1) ? -1 : 1);
  });
  /* covers reach past the tile edge; keep a focused one from scrolling the tile's content sideways */
  tile.addEventListener('scroll', () => { tile.scrollLeft = 0; tile.scrollTop = 0; });
  state(); layout();
  window.addEventListener('resize', layout);
})();
} catch (e) { console.error(e); }
try {
(() => {
  const m = document.getElementById('merci');
  if (!m) return;
  const svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.2l-1.4-1.3C5.4 15.2 2 12.1 2 8.3 2 5.2 4.4 2.8 7.5 2.8c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.8-3.4 6.9-8.6 11.6L12 21.2z"/></svg>';
  m.addEventListener('click', e => {
    e.preventDefault();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const h = document.createElement('span');
    h.className = 'heart';
    h.innerHTML = svg;
    h.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
    h.style.setProperty('--rot', (Math.random() * 30 - 15).toFixed(0) + 'deg');
    m.appendChild(h);
    h.addEventListener('animationend', () => h.remove());
  });
})();
} catch (e) { console.error(e); }
try {
(() => {
  const btn = document.getElementById('dice');
  if (!btn) return;
  const img = btn.querySelector('img');
  let anim = null;
  btn.addEventListener('click', () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (anim) anim.cancel();
    const r = (a) => (Math.random() * 2 - 1) * a;
    const frames = [{ transform: 'scale(1) rotate(0deg)', filter: 'blur(0px)', offset: 0 }];
    // rattle: quick random jolts with motion blur
    for (let i = 1; i <= 9; i++) {
      const k = 1 - i / 12;
      frames.push({
        transform: `translate(${r(9 * k).toFixed(1)}%, ${r(7 * k).toFixed(1)}%) rotate(${r(14 * k).toFixed(1)}deg) scale(${(1.18 - i * 0.008).toFixed(3)})`,
        filter: `blur(${(3.2 * k).toFixed(2)}px)`,
        offset: i * 0.07
      });
    }
    // land and settle
    frames.push({ transform: 'translate(0, -2%) rotate(-2deg) scale(1.06)', filter: 'blur(0px)', offset: 0.78 });
    frames.push({ transform: 'translate(0, 1%) rotate(1deg) scale(.98)', filter: 'blur(0px)', offset: 0.88 });
    frames.push({ transform: 'scale(1) rotate(0deg)', filter: 'blur(0px)', offset: 1 });
    anim = img.animate(frames, { duration: 1100, easing: 'ease-out' });
  });
})();
} catch (e) { console.error(e); }
try {
/* Logo overlay: opened by a click on the icon tile (see the icon script), closed by the veil, the X or Escape */
(() => {
  const modal = document.getElementById('logo-modal'), opener = document.getElementById('kadenz-logo');
  if (!modal || !opener) return;
  const closeBtn = modal.querySelector('.modal__close'), card = modal.querySelector('.modal__card');
  const open = e => {
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-modal');
    /* opened by keyboard: focus goes to the X; by mouse or finger: to the card, so no focus ring flashes up */
    (e && e.detail && e.detail.keyboard ? closeBtn : card).focus({ preventScroll: true });
  };
  const close = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-modal');
    opener.focus({ preventScroll: true });
  };
  document.addEventListener('kadenz:logo', open);
  opener.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); opener.click(); } });   // it is a link acting as a button
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus({ preventScroll: true }); }   // the X is the only stop
  });
})();
} catch (e) { console.error(e); }
try {
(() => {
  const modal = document.getElementById('kadenz-modal');
  const opener = document.getElementById('kadenz');
  if (!modal || !opener) return;
  const closeBtn = modal.querySelector('.modal__close');
  /* Prototype frames: the big one loads on first open and replays on every open; the small one pauses meanwhile */
  const big = modal.querySelector('.modal__phone'), small = document.querySelector('.tile--phone .kz-frame');
  [big, small].forEach(f => f && f.addEventListener('load', () => { if (f.getAttribute('src')) f.classList.add('is-ready'); }));
  if (small && small.contentDocument && small.contentDocument.readyState === 'complete' && small.contentDocument.URL !== 'about:blank') small.classList.add('is-ready');
  const tell = (frame, msg) => { try { if (frame && frame.contentWindow) frame.contentWindow.postMessage(msg, '*'); } catch (e) {} };
  const card = modal.querySelector('.modal__card'), scroller = modal.querySelector('.modal__scroll'), more = modal.querySelector('.modal__more');
  scroller.addEventListener('scroll', () => card.classList.toggle('is-scrolled', scroller.scrollTop > 24), { passive: true });
  more.addEventListener('click', () => {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({ top: modal.querySelector('.modal__screens').offsetTop - 24, behavior: smooth ? 'smooth' : 'auto' });
  });
  let hint = 0;
  const open = () => {
    clearTimeout(hint); card.classList.remove('is-hinting');
    hint = setTimeout(() => card.classList.add('is-hinting'), 2000);   // after two seconds the arrow starts hopping
    modal.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    scroller.scrollTop = 0; card.classList.remove('is-scrolled');
    if (big && !big.getAttribute('src')) big.src = big.dataset.src; else tell(big, 'kadenz:demo');
    tell(small, 'kadenz:stop');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-modal');
    closeBtn.focus({ preventScroll: true });
  };
  const close = () => {
    if (!modal.classList.contains('is-open')) return;
    tell(big, 'kadenz:stop'); tell(small, 'kadenz:demo');
    clearTimeout(hint); card.classList.remove('is-hinting');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-modal');
    opener.focus({ preventScroll: true });
  };
  opener.addEventListener('click', open);
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const stops = card.classList.contains('is-scrolled') ? [closeBtn, scroller] : [closeBtn, more, scroller];
      const at = stops.indexOf(document.activeElement);
      e.preventDefault(); stops[(at + (e.shiftKey ? stops.length - 1 : 1)) % stops.length].focus({ preventScroll: true });
    }
  });
})();
} catch (e) { console.error(e); }

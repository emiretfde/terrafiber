/* terraFIBER Konzept C — terrain point cloud in the GeoExpert principle, in terraFIBER blue.
   Three.js r128 (MIT, /assets/vendor/three.min.js). Same structure as the GeoExpert hero
   (fbm terrain with a calm basin, scan line, live measurement readout, camera parallax),
   with a blue palette and fibre routes instead of cadastral parcels. */
(function () {
  'use strict';

  var CONFIG = {
    // Height colour ramp (0 = valley floor, 1 = highest ridge), RGB 0..1
    ramp: [[0, [0.10, 0.22, 0.34]], [0.15, [0.16, 0.33, 0.50]], [0.42, [0.29, 0.49, 0.71]], [0.7, [0.47, 0.71, 0.95]], [1, [0.90, 0.95, 1.0]]],
    scanColor: [0.78, 0.90, 1.0],   // light of the scan line
    routeColor: 0x4a9bea,           // fibre routes
    activeColor: 0xdff1ff,          // pulsing route segment
    gridDesktop: 250, gridMobile: 170,
    scanSpeed: 16,                  // world units per second
    orbitSpeed: 0.045,              // slow autonomous camera sway
    parallax: 0.18,                 // camera yaw at the screen edge
    parallaxLift: 14,               // camera height change at the screen edge
    easing: 0.04
  };

  var canvas = document.querySelector('.hero-c canvas.cloud');
  if (!canvas) return;
  var lang = (document.documentElement.lang || 'de').slice(0, 2);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { mode: 'none', frames: 0 };
  window.__tfHero = state;

  var fmt = function (n, dec) {
    var s = n.toFixed(dec === undefined ? 2 : dec).split('.');
    var c = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
    return s[1] ? c + (lang === 'en' ? '.' : ',') + s[1] : c;
  };

  /* noise */
  var seed = 11;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var G = 128, grid = new Float32Array(G * G);
  for (var gi = 0; gi < G * G; gi++) grid[gi] = rnd();
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var vn = function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = ease(x - xi), yf = ease(y - yi);
    var g = function (a, b) { return grid[((b % G + G) % G) * G + ((a % G + G) % G)]; };
    var a = g(xi, yi) + (g(xi + 1, yi) - g(xi, yi)) * xf;
    var b = g(xi, yi + 1) + (g(xi + 1, yi + 1) - g(xi, yi + 1)) * xf;
    return a + (b - a) * yf;
  };
  var fbm = function (x, y) { return vn(x, y) * 0.5 + vn(x * 2.03 + 17, y * 2.03 + 9) * 0.27 + vn(x * 4.1 + 31, y * 4.1 + 5) * 0.15 + vn(x * 8.3 + 3, y * 8.3 + 41) * 0.08; };

  var height = function (x, z) {
    var r = Math.sqrt((x / 1.35) * (x / 1.35) + (z - 12) * (z - 12));
    var basin = Math.min(1, Math.max(0, (r - 22) / 72)); basin = basin * basin * (3 - 2 * basin);
    var n = fbm(x * 0.018 + 3, z * 0.018 + 7);
    var ridge = 1 - Math.abs(2 * fbm(x * 0.04 + 11, z * 0.04 + 2) - 1);
    return basin * (14 + 38 * n + 26 * ridge * ridge) + 2.4 * fbm(x * 0.09, z * 0.09);
  };

  var start = function () {
    var THREE = window.THREE;
    if (!THREE) return false;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return false; }
    renderer.setClearColor(0x000000, 0);

    var mobile = window.innerWidth < 760;
    var N = mobile ? CONFIG.gridMobile : CONFIG.gridDesktop, SIZE = 220;
    var total = N * N;
    var pos = new Float32Array(total * 3), col = new Float32Array(total * 3), rand = new Float32Array(total);
    var color = function (t, out, o) {
      var R = CONFIG.ramp;
      for (var i = 1; i < R.length; i++) if (t <= R[i][0]) {
        var a = R[i - 1], b = R[i], k = (t - a[0]) / (b[0] - a[0]);
        out[o] = a[1][0] + (b[1][0] - a[1][0]) * k; out[o + 1] = a[1][1] + (b[1][1] - a[1][1]) * k; out[o + 2] = a[1][2] + (b[1][2] - a[1][2]) * k; return;
      }
    };
    var i3 = 0, maxH = 70;
    for (var iz = 0; iz < N; iz++) for (var ix = 0; ix < N; ix++) {
      var x = (ix / (N - 1) - 0.5) * SIZE + (rnd() - 0.5) * 0.25;
      var z = (iz / (N - 1) - 0.5) * SIZE + (rnd() - 0.5) * 0.6;
      var h = height(x, z);
      pos[i3] = x; pos[i3 + 1] = h; pos[i3 + 2] = z;
      color(Math.min(1, h / maxH), col, i3);
      rand[i3 / 3] = rnd();
      i3 += 3;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('rnd', new THREE.BufferAttribute(rand, 1));
    var pr = Math.min(window.devicePixelRatio || 1, 1.75);
    var uni = { uScan: { value: -110 }, uSize: { value: mobile ? 2.6 : 2.5 }, uPR: { value: pr }, uScanCol: { value: new THREE.Vector3().fromArray(CONFIG.scanColor) } };
    // Premultiplied additive blending: alpha follows brightness, so dim points never darken the page background.
    var ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };
    var mat = new THREE.ShaderMaterial(Object.assign({
      uniforms: uni, vertexColors: true,
      vertexShader: [
        'attribute float rnd; uniform float uScan; uniform float uSize; uniform float uPR; uniform vec3 uScanCol;',
        'varying vec3 vC; varying float vA;',
        'void main(){',
        ' vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        ' float d = abs(position.z - uScan);',
        ' float glow = smoothstep(3.5, 0.0, d);',
        ' float trail = smoothstep(26.0, 0.0, uScan - position.z) * step(position.z, uScan);',
        ' vC = mix(color, uScanCol, glow * 0.9);',
        ' float dist = -mv.z;',
        ' vA = clamp(1.35 - dist / 280.0, 0.18, 1.0) * (0.55 + 0.45 * rnd) + glow * 0.9 + trail * 0.18;',
        ' vA *= smoothstep(95.0, 165.0, dist);',
        ' gl_PointSize = min(uSize * uPR * (1.0 + glow * 1.2) * (170.0 / dist), 3.4 * uPR);',
        ' gl_Position = projectionMatrix * mv;',
        '}'].join('\n'),
      fragmentShader: [
        'varying vec3 vC; varying float vA;',
        'void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c, c); if (r > 0.25) discard;',
        ' vec3 o = vC * vA * (1.0 - smoothstep(0.08, 0.25, r)); gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'].join('\n')
    }, ADD));
    var scene = new THREE.Scene();
    scene.add(new THREE.Points(geo, mat));

    // Fibre routes draped onto the terrain (instead of cadastral parcels).
    var line = function (pts, hex, opacity) {
      var arr = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        for (var s = 0; s <= 12; s++) {
          var t = s / 12, px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
          arr.push(px, height(px, pz) + 0.35, pz);
        }
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
      var l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
      scene.add(l); return l;
    };
    var trunk = [[2, 14], [10, 11], [16, 13], [28, 9], [40, 11], [52, 7], [64, 9]];
    line(trunk, CONFIG.routeColor, 0.95);
    var branches = [
      [[10, 11], [9, 2], [12, -6]],
      [[16, 13], [18, 21], [15, 29]],
      [[28, 9], [30, 0], [34, -7]],
      [[40, 11], [42, 20], [46, 28]],
      [[52, 7], [55, -1], [53, -8]]
    ];
    branches.forEach(function (b) { line(b, CONFIG.routeColor, 0.75); });
    // short drop lines to houses along each branch end
    branches.forEach(function (b) {
      var e = b[b.length - 1], p = b[b.length - 2];
      var dx = e[0] - p[0], dz = e[1] - p[1], L = Math.sqrt(dx * dx + dz * dz) || 1; dx /= L; dz /= L;
      for (var k = 0; k < 2; k++) {
        var mx = p[0] + (e[0] - p[0]) * (0.45 + k * 0.4), mz = p[1] + (e[1] - p[1]) * (0.45 + k * 0.4), sd = k ? 1 : -1;
        line([[mx, mz], [mx + sd * dz * 2.2, mz - sd * dx * 2.2]], CONFIG.routeColor, 0.55);
      }
    });
    var active = line([[40, 11], [42, 20], [46, 28]], CONFIG.activeColor, 1);

    var camera = new THREE.PerspectiveCamera(36, 1, 1, 600);
    var target = new THREE.Vector3(18, 6, -6);
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var size = function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 52 : 36;
      camera.updateProjectionMatrix();
    };
    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    var oT = document.getElementById('o-t'), oY = document.getElementById('o-y'), oX = document.getElementById('o-x'), oH = document.getElementById('o-h');
    var last = 0, nr = 427;
    // Illustrative UTM 32N coordinates around the Münsterland; the caption marks the graphic as an illustration.
    var readout = function (scan) {
      for (var p = 0; p < 40; p++) {
        var k = Math.floor(rnd() * total) * 3;
        if (Math.abs(pos[k + 2] - scan) < 3 && Math.abs(pos[k]) < 70) {
          nr = (nr % 9999) + 1;
          if (oT) oT.textContent = String(nr).padStart(4, '0');
          if (oY) oY.textContent = fmt(393400 + pos[k] * 1.8);
          if (oX) oX.textContent = fmt(5793250 - pos[k + 2] * 1.8);
          if (oH) oH.textContent = fmt(42 + pos[k + 1] * 0.9) + ' m';
          return;
        }
      }
    };

    var running = true, t0 = performance.now();
    var frame = function (now) {
      var t = (now - t0) / 1000;
      mouse.x += (mouse.tx - mouse.x) * CONFIG.easing; mouse.y += (mouse.ty - mouse.y) * CONFIG.easing;
      var yaw = -0.32 + Math.sin(t * CONFIG.orbitSpeed) * 0.22 + mouse.x * CONFIG.parallax;
      var r = 205;
      camera.position.set(target.x + Math.sin(yaw) * r, 74 - mouse.y * CONFIG.parallaxLift, target.z + Math.cos(yaw) * r);
      camera.lookAt(target);
      var scan = ((t * CONFIG.scanSpeed) % 240) - 120;
      uni.uScan.value = scan;
      active.material.opacity = 0.6 + Math.sin(t * 2.2) * 0.4;
      renderer.render(scene, camera);
      state.frames++;
      if (now - last > 140) { last = now; readout(scan); }
      if (running && !reduced) requestAnimationFrame(frame);
    };
    state.mode = 'webgl';
    state.sample = function () {
      renderer.render(scene, camera);
      var gl = renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      var px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      var lit = 0; for (var q = 0; q < px.length; q += 4) if (px[q] + px[q + 1] + px[q + 2] > 30) lit++;
      return lit / (W * H);
    };
    if (reduced) { uni.uScan.value = 20; frame(t0); readout(20); return true; }
    requestAnimationFrame(frame);
    var visible = true, shown = true;
    var refresh = function () {
      var want = visible && shown;
      if (want && !running) { running = true; requestAnimationFrame(frame); } else if (!want) running = false;
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (u) { visible = u[0].isIntersecting; refresh(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { shown = !document.hidden; refresh(); });
    return true;
  };

  var boot = function () {
    var ok = false;
    try { ok = start(); } catch (e) { ok = false; }
    if (!ok) { state.mode = 'static'; document.querySelector('.hero-c').classList.add('is-static'); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

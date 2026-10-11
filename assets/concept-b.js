/* terraFIBER Konzept B — topographic terrain model with an FTTH network.
   ---------------------------------------------------------------------
   WebGL (Three.js r128, MIT, /assets/vendor/three.min.js) renders:
     1. a digital terrain model as a hill-shaded point cloud,
     2. cartographic contour lines (every 5th line is an index contour),
     3. an FTTH network laid on the relief: POP → trunk along the valley →
        branches to distribution cabinets → drop lines to houses,
     4. light pulses leaving the POP; every node lights up when a pulse arrives.
   The terrain itself is rigid; only a barely visible "breathing" and a slow
   camera drift with pointer parallax create the depth.
   Fallbacks: no WebGL → static Canvas2D projection of the same terrain;
   prefers-reduced-motion → one still frame, no animation.
   Everything below CONFIG can stay untouched when tuning the look. */
(function () {
  'use strict';

  var CONFIG = {
    // Palette (RGB 0..1). Accent follows the terraFIBER logo blue #4A9BEA.
    fiber: [0.26, 0.60, 0.98],
    signal: [0.86, 0.94, 1.0],
    terrainLow: [0.21, 0.29, 0.37],
    terrainMid: [0.45, 0.53, 0.61],
    terrainHigh: [0.84, 0.88, 0.92],
    contour: [0.50, 0.60, 0.70],

    // Terrain
    gridDesktop: 280,          // points per side (280² ≈ 78 400 points)
    gridMobile: 170,
    relief: 1.0,               // height multiplier
    breathing: 0.7,            // slow surface movement in world units (0 = rigid)
    contourStep: 2.6,          // height between contour lines
    contourAlpha: 0.09,        // normal contour opacity
    indexContourAlpha: 0.22,   // every 5th contour

    // Network / signals
    pulseSpeed: 15,            // world units per second
    pulseSpacing: 78,          // distance between consecutive pulses
    pulseTail: 7,              // length of the light trail
    cableAlpha: 0.75,

    // Camera
    orbitAmplitude: 0.13,      // radians of slow autonomous sway
    orbitPeriod: 150,          // seconds for one full sway
    parallax: 0.24,            // radians of yaw at the screen edge
    parallaxLift: 22,          // camera height change at the screen edge
    easing: 0.045,             // 0..1, lower = softer follow

    // Terrain reaction under the cursor
    hoverRadius: 30,           // world units of the swell around the cursor
    hoverLift: 9,              // how high the terrain rises under the cursor
    hoverRipple: 0.4,          // strength of the soft outward wave
    hoverGlow: 1.0,            // brightening of points/contours near the cursor
    hoverFollow: 0.10,         // 0..1, how fast the swell follows the cursor

    // Performance
    maxPixelRatio: 1.75,
    maxPixelRatioMobile: 1.5
  };

  var canvas = document.querySelector('.hero-immersive .fiber-field');
  var hero = document.querySelector('.hero-immersive');
  if (!canvas || !hero) return;

  var state = { mode: 'none', frames: 0, quality: 'high' };
  window.__tfHero = state;

  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = function () { return (canvas.clientWidth || window.innerWidth) < 760; };

  /* ---------- deterministic noise ---------- */
  var seed = 20260;
  var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var NG = 256, lattice = new Float32Array(NG * NG);
  for (var li = 0; li < NG * NG; li++) lattice[li] = rand();
  var fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
  var cell = function (a, b) { return lattice[((b & 255) * NG) + (a & 255)]; };
  var vnoise = function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi);
    var a = cell(xi, yi), b = cell(xi + 1, yi), c = cell(xi, yi + 1), d = cell(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  var fbm = function (x, y) {
    var v = 0, amp = 0.5, f = 1;
    for (var o = 0; o < 5; o++) { v += amp * vnoise(x * f + o * 13.1, y * f - o * 7.7); f *= 2.02; amp *= 0.5; }
    return v / 0.96875;
  };
  var smooth = function (e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  /* ---------- terrain model (world units, x/z ∈ [-SIZE/2, SIZE/2]) ---------- */
  var SIZE = 260;
  var riverZ = function (x) { return 16 * Math.sin(x * 0.021 + 0.7) + 7 * Math.sin(x * 0.047 + 2.1); };
  var height = function (x, z) {
    var base = fbm(x * 0.0105 + 4.2, z * 0.0105 + 1.3);
    var ridge = 1 - Math.abs(2 * fbm(x * 0.024 + 9.0, z * 0.024 + 3.0) - 1);
    var valley = smooth(5, 38, Math.abs(z - riverZ(x)));
    // Low, readable foreground; a mountain range rises towards the back.
    var range = 0.42 + 1.05 * smooth(10, -120, z) + 0.25 * smooth(70, 125, Math.abs(x));
    var h = valley * (4 + 44 * Math.pow(base, 1.5) + 22 * ridge * ridge) * range;
    h += 1.4 * fbm(x * 0.07 + 2.0, z * 0.07 + 5.0);
    return h * CONFIG.relief;
  };

  /* ---------- FTTH network on the terrain ---------- */
  var catmull = function (pts, stepLen) {
    // Centripetal-ish Catmull-Rom through 2D control points, resampled evenly.
    var dense = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < 24; k++) {
        var t = k / 24, t2 = t * t, t3 = t2 * t;
        dense.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    dense.push(pts[pts.length - 1].slice());
    var out = [dense[0]], acc = 0;
    for (var j = 1; j < dense.length; j++) {
      var dx = dense[j][0] - dense[j - 1][0], dz = dense[j][1] - dense[j - 1][1];
      acc += Math.sqrt(dx * dx + dz * dz);
      if (acc >= stepLen || j === dense.length - 1) { out.push(dense[j]); acc = 0; }
    }
    return out;
  };

  var buildNetwork = function () {
    var routes = [], nodes = [];
    var drape = function (pts2, s0, lift) {
      var out = [], s = s0;
      for (var i = 0; i < pts2.length; i++) {
        if (i) { var dx = pts2[i][0] - pts2[i - 1][0], dz = pts2[i][1] - pts2[i - 1][1]; s += Math.sqrt(dx * dx + dz * dz); }
        out.push({ x: pts2[i][0], y: height(pts2[i][0], pts2[i][1]) + lift, z: pts2[i][1], s: s });
      }
      return out;
    };
    var nearest = function (route, x, z) {
      var best = route[0], bd = 1e9;
      for (var i = 0; i < route.length; i++) { var d = (route[i].x - x) * (route[i].x - x) + (route[i].z - z) * (route[i].z - z); if (d < bd) { bd = d; best = route[i]; } }
      return best;
    };
    var road = function (x) { return riverZ(x) - 9; }; // the trunk follows the road on the valley edge

    var pop = [-12, road(-12)];
    nodes.push({ x: pop[0], z: pop[1], s: 0, kind: 3 });

    var east = [], west = [];
    for (var x = -12; x <= 118; x += 13) east.push([x, road(x)]);
    for (var xw = -12; xw >= -112; xw -= 13) west.push([xw, road(xw)]);
    var trunkE = drape(catmull(east, 0.9), 0, 0.55);
    var trunkW = drape(catmull(west, 0.9), 0, 0.55);
    routes.push({ pts: trunkE, level: 0 }, { pts: trunkW, level: 0 });

    // Distribution branches: [start x on trunk, control points…, cabinet]
    var branches = [
      { trunk: trunkE, from: 8, via: [[-2, -26], [6, -46], [22, -60]] },
      { trunk: trunkE, from: 42, via: [[56, -30], [50, -54], [62, -76]] },
      { trunk: trunkE, from: 84, via: [[96, -22], [92, -44]] },
      { trunk: trunkE, from: 26, via: [[36, 18], [28, 40], [40, 56]] },
      { trunk: trunkE, from: 70, via: [[78, 22], [94, 38]] },
      { trunk: trunkW, from: -46, via: [[-60, -24], [-54, -50], [-68, -66]] },
      { trunk: trunkW, from: -82, via: [[-92, 16], [-80, 36]] }
    ];
    branches.forEach(function (b, bi) {
      var start = nearest(b.trunk, b.from, road(b.from));
      var ctrl = [[start.x, start.z]].concat(b.via);
      var pts = drape(catmull(ctrl, 0.9), start.s, 0.5);
      routes.push({ pts: pts, level: 1 });
      var cab = pts[pts.length - 1];
      nodes.push({ x: cab.x, z: cab.z, s: cab.s, kind: 2 });

      // Street with drop cables to houses, continuing beyond the cabinet.
      var last = pts[pts.length - 2];
      var dirX = cab.x - last.x, dirZ = cab.z - last.z, len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      dirX /= len; dirZ /= len;
      var bend = (bi % 2 ? 1 : -1) * 0.35;
      var street2 = [];
      for (var k = 0; k <= 5; k++) {
        var a = bend * k / 5, cx = Math.cos(a) * dirX - Math.sin(a) * dirZ, cz = Math.sin(a) * dirX + Math.cos(a) * dirZ;
        var prev = street2.length ? street2[street2.length - 1] : [cab.x, cab.z];
        street2.push(k === 0 ? [cab.x, cab.z] : [prev[0] + cx * 5.2, prev[1] + cz * 5.2]);
      }
      var street = drape(catmull(street2, 0.8), cab.s, 0.45);
      routes.push({ pts: street, level: 2 });
      for (var h = 1; h < 6; h++) {
        var sp = street[Math.min(street.length - 1, Math.round(h / 5 * (street.length - 1)))];
        for (var side = -1; side <= 1; side += 2) {
          if (rand() < 0.18) continue;
          var nx = -dirZ * side, nz = dirX * side, off = 3.6 + rand() * 1.6;
          var hx = sp.x + nx * off, hz = sp.z + nz * off;
          var drop = drape([[sp.x, sp.z], [sp.x + nx * off * 0.5, sp.z + nz * off * 0.5], [hx, hz]], sp.s, 0.4);
          routes.push({ pts: drop, level: 3 });
          nodes.push({ x: hx, z: hz, s: drop[drop.length - 1].s, kind: 1 });
        }
      }
    });
    nodes.forEach(function (n) { n.y = height(n.x, n.z) + 0.6; });
    return { routes: routes, nodes: nodes };
  };

  /* ---------- contour lines (marching squares) ---------- */
  var buildContours = function (M) {
    var step = SIZE / (M - 1), H = new Float32Array(M * M), maxH = 0;
    for (var j = 0; j < M; j++) for (var i = 0; i < M; i++) {
      var hv = height(-SIZE / 2 + i * step, -SIZE / 2 + j * step); H[j * M + i] = hv; if (hv > maxH) maxH = hv;
    }
    var pos = [], idx = [];
    var lerp = function (a, b, va, vb, lvl) { var t = (lvl - va) / (vb - va); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    for (var n = 1; n * CONFIG.contourStep < maxH; n++) {
      var lvl = n * CONFIG.contourStep, isIndex = n % 5 === 0 ? 1 : 0;
      for (var jj = 0; jj < M - 1; jj++) for (var ii = 0; ii < M - 1; ii++) {
        var v0 = H[jj * M + ii], v1 = H[jj * M + ii + 1], v2 = H[(jj + 1) * M + ii + 1], v3 = H[(jj + 1) * M + ii];
        var c = (v0 > lvl ? 1 : 0) | (v1 > lvl ? 2 : 0) | (v2 > lvl ? 4 : 0) | (v3 > lvl ? 8 : 0);
        if (c === 0 || c === 15) continue;
        var x0 = -SIZE / 2 + ii * step, z0 = -SIZE / 2 + jj * step;
        var p0 = [x0, z0], p1 = [x0 + step, z0], p2 = [x0 + step, z0 + step], p3 = [x0, z0 + step];
        var e = [lerp(p0, p1, v0, v1, lvl), lerp(p1, p2, v1, v2, lvl), lerp(p2, p3, v2, v3, lvl), lerp(p3, p0, v3, v0, lvl)];
        var segs = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]] }[c];
        for (var sg = 0; sg < segs.length; sg++) {
          var A = e[segs[sg][0]], B = e[segs[sg][1]];
          pos.push(A[0], lvl + 0.08, A[1], B[0], lvl + 0.08, B[1]);
          idx.push(isIndex, isIndex);
        }
      }
    }
    return { pos: new Float32Array(pos), idx: new Float32Array(idx), maxH: maxH };
  };

  /* ---------- shared GLSL ---------- */
  var GLSL_COMMON = [
    'uniform float uTime; uniform float uBreath; uniform float uPR;',
    'uniform float uSpeed; uniform float uSpacing; uniform float uTail;',
    'uniform vec2 uMouse; uniform float uHover; uniform float uHR; uniform float uHL; uniform float uHRip; uniform float uHG;',
    'float breathe(vec3 p){ return uBreath * sin(uTime*0.11 + p.x*0.021) * cos(uTime*0.083 + p.z*0.027); }',
    'float hoverD2(vec3 p){ vec2 d = p.xz - uMouse; return dot(d,d); }',
    // Swell under the cursor plus a soft travelling ring; shared by every layer so cables stay on the ground.
    'float field(vec3 p){ float d2 = hoverD2(p); float r2 = uHR*uHR; float bump = exp(-d2/r2);',
    ' float ring = uHRip * sin(sqrt(d2)*0.32 - uTime*2.0) * exp(-d2/(r2*3.5));',
    ' return breathe(p) + uHover * uHL * (bump + ring); }',
    'float glow(vec3 p){ return uHover * uHG * exp(-hoverD2(p)/(uHR*uHR*1.8)); }',
    // Comet-shaped pulse travelling outward from the POP; s = network distance.
    'float pulse(float s, float tail){ float p = (uTime*uSpeed - s)/uSpacing; if (p < 0.0) return 0.0; float f = fract(p); return exp(-f*uSpacing/tail); }',
    'float depthFade(float d){ return smoothstep(120.0, 190.0, d) * (1.0 - smoothstep(400.0, 520.0, d)); }',
    'float edgeFade(vec3 p){ float m = length(p.xz * vec2(0.92, 1.0)); return 1.0 - smoothstep(98.0, 132.0, m); }'
  ].join('\n');

  /* ---------- WebGL scene ---------- */
  var startWebGL = function () {
    var THREE = window.THREE;
    if (!THREE) return false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;
    renderer.setClearColor(0x000000, 0);

    var mobile = narrow();
    var lowEnd = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
    var N = mobile || lowEnd ? CONFIG.gridMobile : CONFIG.gridDesktop;
    var prCap = mobile ? CONFIG.maxPixelRatioMobile : CONFIG.maxPixelRatio;
    var pr = Math.min(window.devicePixelRatio || 1, prCap);

    var uniforms = {
      uTime: { value: 0 }, uBreath: { value: CONFIG.breathing }, uPR: { value: pr },
      uSpeed: { value: CONFIG.pulseSpeed }, uSpacing: { value: CONFIG.pulseSpacing }, uTail: { value: CONFIG.pulseTail },
      uMouse: { value: new THREE.Vector2(0, 0) }, uHover: { value: 0 }, uHR: { value: CONFIG.hoverRadius },
      uHL: { value: CONFIG.hoverLift }, uHRip: { value: CONFIG.hoverRipple }, uHG: { value: CONFIG.hoverGlow }
    };
    var scene = new THREE.Scene();

    /* terrain points with hill-shading */
    var count = N * N, pos = new Float32Array(count * 3), col = new Float32Array(count * 3), rnd = new Float32Array(count);
    var light = [0.78, 0.52, 0.34], ll = Math.sqrt(light[0] * light[0] + light[1] * light[1] + light[2] * light[2]);
    light = [light[0] / ll, light[1] / ll, light[2] / ll];
    var maxH = 64 * CONFIG.relief, k3 = 0, dStep = SIZE / (N - 1);
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var x = -SIZE / 2 + (i + (j % 2) * 0.5) * dStep + (rand() - 0.5) * dStep * 0.85;
      var z = -SIZE / 2 + j * dStep + (rand() - 0.5) * dStep * 0.85;
      var y = height(x, z);
      var e = 0.9, nx = height(x - e, z) - height(x + e, z), nz = height(x, z - e) - height(x, z + e), ny = 2 * e;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      var lambert = Math.max(0, (nx * light[0] + ny * light[1] + nz * light[2]) / nl);
      var t = Math.min(1, Math.max(0, y / maxH)), c0, c1, kk;
      if (t < 0.45) { c0 = CONFIG.terrainLow; c1 = CONFIG.terrainMid; kk = t / 0.45; }
      else { c0 = CONFIG.terrainMid; c1 = CONFIG.terrainHigh; kk = (t - 0.45) / 0.55; }
      var shade = 0.38 + 1.05 * Math.pow(lambert, 1.6);
      pos[k3] = x; pos[k3 + 1] = y; pos[k3 + 2] = z;
      col[k3] = (c0[0] + (c1[0] - c0[0]) * kk) * shade;
      col[k3 + 1] = (c0[1] + (c1[1] - c0[1]) * kk) * shade;
      col[k3 + 2] = (c0[2] + (c1[2] - c0[2]) * kk) * shade;
      rnd[k3 / 3] = rand();
      k3 += 3;
    }
    var tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    tGeo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    var tMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uSize: { value: mobile ? 2.6 : 2.4 } }, uniforms),
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor, vertexColors: true,
      vertexShader: GLSL_COMMON + '\nattribute float rnd; uniform float uSize; varying vec3 vC; varying float vA;\n' +
        'void main(){ vec3 p = position; p.y += field(p); vec4 mv = modelViewMatrix * vec4(p,1.0); float d = -mv.z;\n' +
        ' float g = glow(p); vC = mix(color, vec3(0.80, 0.90, 1.0), g*0.35); vA = depthFade(d) * edgeFade(p) * (0.62 + 0.38*rnd) * clamp(1.45 - d/560.0, 0.55, 1.0) * (1.0 + g*0.9);\n' +
        ' gl_PointSize = clamp(uSize * uPR * (175.0 / d), 0.6*uPR, 3.0*uPR); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA;\n' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c,c); if (r > 0.25) discard; vec3 o = vC * vA * (1.0 - smoothstep(0.06, 0.25, r)); gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'
    });
    scene.add(new THREE.Points(tGeo, tMat));

    /* contours */
    var cont = buildContours(mobile ? 120 : 170);
    var cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.BufferAttribute(cont.pos, 3));
    cGeo.setAttribute('idx', new THREE.BufferAttribute(cont.idx, 1));
    var cMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uColor: { value: new THREE.Vector3().fromArray(CONFIG.contour) }, uA: { value: CONFIG.contourAlpha }, uAI: { value: CONFIG.indexContourAlpha } }, uniforms),
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: GLSL_COMMON + '\nattribute float idx; varying float vA;\nuniform float uA; uniform float uAI;\n' +
        'void main(){ vec3 p = position; p.y += field(p); vec4 mv = modelViewMatrix * vec4(p,1.0);\n' +
        ' vA = mix(uA, uAI, idx) * depthFade(-mv.z) * edgeFade(p) * (1.0 + glow(p)*3.2); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ vec3 o = uColor * vA; gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'
    });
    scene.add(new THREE.LineSegments(cGeo, cMat));

    /* network: cables as lines + dense glow points, nodes as rings */
    var net = buildNetwork();
    var lp = [], ls = [], ll2 = [], cp = [], cs = [], cl = [];
    net.routes.forEach(function (r) {
      for (var i = 0; i < r.pts.length - 1; i++) {
        var a = r.pts[i], b = r.pts[i + 1];
        lp.push(a.x, a.y, a.z, b.x, b.y, b.z); ls.push(a.s, b.s); ll2.push(r.level, r.level);
      }
      // dense sample points give the cable a physical, slightly thicker body
      for (var k = 0; k < r.pts.length - 1; k++) {
        var p = r.pts[k], q = r.pts[k + 1];
        for (var u = 0; u < 3; u++) {
          var t = u / 3;
          cp.push(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, p.z + (q.z - p.z) * t);
          cs.push(p.s + (q.s - p.s) * t); cl.push(r.level);
        }
      }
    });
    var cabUni = Object.assign({
      uFiber: { value: new THREE.Vector3().fromArray(CONFIG.fiber) },
      uSignal: { value: new THREE.Vector3().fromArray(CONFIG.signal) },
      uCable: { value: CONFIG.cableAlpha }
    }, uniforms);
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
    lineGeo.setAttribute('s', new THREE.BufferAttribute(new Float32Array(ls), 1));
    lineGeo.setAttribute('lvl', new THREE.BufferAttribute(new Float32Array(ll2), 1));
    var cableVS = GLSL_COMMON + '\nattribute float s; attribute float lvl; uniform vec3 uFiber; uniform vec3 uSignal; uniform float uCable;\n' +
      'varying vec3 vC; varying float vA; varying float vP;\n';
    scene.add(new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
      uniforms: cabUni, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: cableVS + 'void main(){ vec3 p = position; p.y += field(p); vec4 mv = modelViewMatrix * vec4(p,1.0);\n' +
        ' vP = pulse(s, uTail); float lv = 1.0 - lvl*0.17; vC = mix(uFiber, uSignal, clamp(vP,0.0,1.0));\n' +
        ' vA = (uCable*lv + vP*0.9) * depthFade(-mv.z) * edgeFade(p); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA; varying float vP; void main(){ vec3 o = vC * vA; gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'
    })));

    var cGeo2 = new THREE.BufferGeometry();
    cGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cp), 3));
    cGeo2.setAttribute('s', new THREE.BufferAttribute(new Float32Array(cs), 1));
    cGeo2.setAttribute('lvl', new THREE.BufferAttribute(new Float32Array(cl), 1));
    scene.add(new THREE.Points(cGeo2, new THREE.ShaderMaterial({
      uniforms: cabUni, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: cableVS + 'void main(){ vec3 p = position; p.y += field(p); vec4 mv = modelViewMatrix * vec4(p,1.0); float d = -mv.z;\n' +
        ' vP = pulse(s, uTail); float lv = 1.0 - lvl*0.2; vC = mix(uFiber, uSignal, clamp(vP*1.2,0.0,1.0));\n' +
        ' vA = (0.55*lv + vP*1.2) * depthFade(d) * edgeFade(p);\n' +
        ' gl_PointSize = clamp((2.3*lv + vP*3.6) * uPR * (170.0/d), 1.2*uPR, 7.0*uPR); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA; varying float vP;\n' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c,c); if (r > 0.25) discard; vec3 o = vC * vA * (1.0 - smoothstep(0.0, 0.25, r)); gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'
    })));

    var np = [], ns = [], nk = [];
    net.nodes.forEach(function (n) { np.push(n.x, n.y, n.z); ns.push(n.s); nk.push(n.kind); });
    var nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(np), 3));
    nGeo.setAttribute('s', new THREE.BufferAttribute(new Float32Array(ns), 1));
    nGeo.setAttribute('kind', new THREE.BufferAttribute(new Float32Array(nk), 1));
    scene.add(new THREE.Points(nGeo, new THREE.ShaderMaterial({
      uniforms: cabUni, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: GLSL_COMMON + '\nattribute float s; attribute float kind; varying float vP; varying float vK; varying float vA;\n' +
        'void main(){ vec3 p = position; p.y += field(p); vec4 mv = modelViewMatrix * vec4(p,1.0); float d = -mv.z;\n' +
        ' vP = pulse(s, 22.0); vK = kind; vA = depthFade(d) * edgeFade(p);\n' +
        ' float base = kind > 2.5 ? 26.0 : (kind > 1.5 ? 17.0 : 8.0);\n' +
        ' gl_PointSize = clamp(base * (1.0 + vP*0.35) * uPR * (150.0/d), 3.0*uPR, 30.0*uPR); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uFiber; uniform vec3 uSignal; varying float vP; varying float vK; varying float vA;\n' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;\n' +
        ' float core = 1.0 - smoothstep(0.10, 0.17, r);\n' +
        ' float ring = (vK > 1.5) ? smoothstep(0.30, 0.34, r) * (1.0 - smoothstep(0.37, 0.42, r)) : 0.0;\n' +
        ' float wave = smoothstep(0.02, 0.0, abs(r - (0.18 + 0.30*(1.0 - vP)))) * vP;\n' +
        ' float halo = (1.0 - smoothstep(0.0, 0.5, r)) * 0.22 * (0.4 + vP);\n' +
        ' vec3 colr = mix(uFiber, uSignal, clamp(vP + (vK > 0.5 && vK < 1.5 ? 0.35 : 0.0), 0.0, 1.0));\n' +
        ' float a = (core*(0.75 + vP*0.6) + ring*0.7 + wave*0.9 + halo) * vA;\n' +
        ' vec3 o = colr * a; gl_FragColor = vec4(o, max(o.r, max(o.g, o.b))); }'
    })));

    /* camera */
    var camera = new THREE.PerspectiveCamera(34, 1, 1, 900);
    var target = new THREE.Vector3(8, 6, -8);
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var w = 0, h = 0;
    var resize = function () {
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      mobile = w < 760;
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 0.8 ? 50 : (camera.aspect < 1.25 ? 42 : 34);
      camera.updateProjectionMatrix();
      draw(lastT);
    };
    var lastT = 0;
    var place = function (t) {
      var sway = Math.sin(t * Math.PI * 2 / CONFIG.orbitPeriod) * CONFIG.orbitAmplitude;
      var yaw = -0.30 + sway + pointer.x * CONFIG.parallax;
      var radius = mobile ? 262 : 228;
      var lift = mobile ? 140 : 118;
      camera.position.set(target.x + Math.sin(yaw) * radius, lift - pointer.y * CONFIG.parallaxLift, target.z + Math.cos(yaw) * radius);
      camera.lookAt(target);
      // Shift the view so the terrain crest sits behind the upper/right part of the hero, away from the headline.
      if (camera.setViewOffset) {
        var ox = mobile ? -w * 0.04 : -w * 0.17, oy = mobile ? h * 0.23 : h * 0.02;
        camera.setViewOffset(w, h, ox, oy, w, h);
      }
    };
    var draw = function (t) {
      if (!w || !h) return;
      uniforms.uTime.value = t;
      place(t);
      updateHover();
      renderer.render(scene, camera);
      state.frames++;
    };

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      pointer.tx = Math.max(-0.5, Math.min(0.5, e.clientX / window.innerWidth - 0.5));
      pointer.ty = Math.max(-0.5, Math.min(0.5, e.clientY / window.innerHeight - 0.5));
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; });

    /* cursor → point on the terrain (ray march against the height model) */
    var hover = { ndc: new THREE.Vector2(), active: false, has: false, x: 0, z: 0, k: 0 };
    var ray = new THREE.Raycaster(), hit = new THREE.Vector3();
    var pick = function () {
      ray.setFromCamera(hover.ndc, camera);
      var o = ray.ray.origin, d = ray.ray.direction, t0 = 0, step = 6;
      for (var i = 0; i < 120; i++) {
        var t1 = t0 + step;
        hit.copy(d).multiplyScalar(t1).add(o);
        if (hit.y <= height(hit.x, hit.z)) {
          var lo = t0, hi = t1;                          // refine between the two samples
          for (var b = 0; b < 8; b++) { var m = (lo + hi) / 2; hit.copy(d).multiplyScalar(m).add(o); if (hit.y <= height(hit.x, hit.z)) hi = m; else lo = m; }
          return Math.abs(hit.x) < SIZE / 2 && Math.abs(hit.z) < SIZE / 2;
        }
        t0 = t1;
      }
      return false;
    };
    var updateHover = function () {
      var on = hover.active && pick();
      if (on) {
        if (!hover.has) { hover.x = hit.x; hover.z = hit.z; hover.has = true; }
        hover.x += (hit.x - hover.x) * CONFIG.hoverFollow;
        hover.z += (hit.z - hover.z) * CONFIG.hoverFollow;
      }
      hover.k += ((on ? 1 : 0) - hover.k) * 0.06;
      uniforms.uMouse.value.set(hover.x, hover.z);
      uniforms.uHover.value = hover.k;
    };
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = canvas.getBoundingClientRect();
      hover.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      hover.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { hover.active = false; }, { passive: true });

    /* loop with visibility pausing and adaptive quality */
    var running = false, raf = 0, clock = 0, prev = 0, visible = true, samples = [], degraded = false;
    // Start the network mid-flow so pulses are already travelling on first paint.
    var T0 = 34;
    var frame = function (now) {
      if (!running) return;
      var dt = prev ? Math.min(now - prev, 80) : 16; prev = now;
      clock += dt / 1000;
      pointer.x += (pointer.tx - pointer.x) * CONFIG.easing;
      pointer.y += (pointer.ty - pointer.y) * CONFIG.easing;
      lastT = T0 + clock;
      draw(lastT);
      if (!degraded && samples.length < 90) {
        samples.push(dt);
        if (samples.length === 90) {
          var avg = samples.slice(30).reduce(function (a, b) { return a + b; }, 0) / 60;
          if (avg > 26) { degraded = true; state.quality = 'reduced'; pr = 1; resize(); }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    var update = function () {
      var should = visible && !document.hidden && !reducedQuery.matches;
      if (should && !running) { running = true; prev = 0; raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
      if (!should) draw(T0 + clock);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }, { threshold: 0.02 }).observe(hero);
    }
    document.addEventListener('visibilitychange', update);
    if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', update);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; cancelAnimationFrame(raf); });

    state.mode = 'webgl';
    state.sample = function () {
      // QA helper: renders a frame and returns the share of lit pixels.
      draw(lastT || T0);
      var gl = renderer.getContext(), W = gl.drawingBufferWidth, Hh = gl.drawingBufferHeight;
      var px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px);
      var lit = 0; for (var q = 0; q < px.length; q += 4) if (px[q] + px[q + 1] + px[q + 2] > 30) lit++;
      return lit / (W * Hh);
    };
    resize();
    update();
    return true;
  };

  /* ---------- Canvas2D fallback: a still projection of the same terrain ---------- */
  var startFallback = function () {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var paint = function () {
      var w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var yaw = -0.30, cx = Math.sin(yaw) * 215 + 18, cz = Math.cos(yaw) * 215 - 12, cy = 76;
      var fx = 18 - cx, fy = 4 - cy, fz = -12 - cz, fl = Math.sqrt(fx * fx + fy * fy + fz * fz); fx /= fl; fy /= fl; fz /= fl;
      var rx = fz, rz = -fx, rl = Math.sqrt(rx * rx + rz * rz); rx /= rl; rz /= rl;
      var ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
      var focal = (h / 2) / Math.tan(17 * Math.PI / 180);
      var N = 140, step = SIZE / (N - 1);
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var x = -SIZE / 2 + i * step, z = -SIZE / 2 + j * step, y = height(x, z);
        var dx = x - cx, dy = y - cy, dz = z - cz, d = dx * fx + dy * fy + dz * fz;
        if (d < 60) continue;
        var sx = w / 2 + w * 0.08 + (dx * rx + dz * rz) / d * focal, sy = h / 2 - h * 0.14 - (dx * ux + dy * uy + dz * uz) / d * focal;
        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
        var a = Math.min(1, (d - 60) / 70) * (1 - Math.min(1, Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - 92) / 37)));
        ctx.fillStyle = 'rgba(' + Math.round(110 + y * 2) + ',' + Math.round(140 + y * 1.6) + ',' + Math.round(170 + y * 1.2) + ',' + (0.35 * a).toFixed(3) + ')';
        ctx.fillRect(sx, sy, 1.3, 1.3);
      }
    };
    state.mode = 'canvas2d';
    hero.classList.add('is-static');
    paint();
    if ('ResizeObserver' in window) new ResizeObserver(paint).observe(canvas);
  };

  var boot = function () {
    var ok = false;
    try { ok = startWebGL(); } catch (e) { ok = false; }
    if (!ok) startFallback();
    hero.classList.add('is-ready');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

import { AlphaVideo } from "./alphaVideo.js";
import { Ball } from "./ball.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a, b) => clamp((v - a) / (b - a));
const smooth = (a, b, v) => { const t = map(v, a, b); return t * t * (3 - 2 * t); };
const easeIn = (t) => t * t * t;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = () => matchMedia("(max-width: 820px)").matches;
let vw = innerWidth, vh = innerHeight;

// ---------- smooth scroll ----------
const lenis = window.Lenis && !reduced ? new window.Lenis({ lerp: 0.11, smoothWheel: true }) : null;
$$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const target = $(a.getAttribute("href"));
  if (!target) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: "smooth" });
}));

// ---------- serve section: hero loop, then the serve scrubs with scroll ----------
const serveSec = $("#serve");
const stage = $("#stage");
const stageLayer = $(".stage-layer");
const layers = $$(".serve [data-depth]");
const title = $(".title");
const heroUI = $(".hero-ui");
const captions = $(".serve-caption");
const capSpans = $$(".serve-caption span");
const wipe = $(".ball-wipe");
const heroCanvas = $("#heroCanvas");
const serveCanvas = $("#serveCanvas");
const serveCtx = serveCanvas.getContext("2d");

const hiRes = () => stage.offsetWidth * Math.min(devicePixelRatio || 1, 2) > 760;
const hero = new AlphaVideo(heroCanvas, `assets/hero/hero-${hiRes() ? 1080 : 720}.mp4`);
hero.onready = () => stage.classList.add("is-live");

// serve: 79 keyed frames (source 0..78); frame 78 has the ball filling most of the plate
const SERVE_COUNT = 79;
const BALL_END = { x: 0.3747, y: 0.6384, r: 0.3785 }; // ball at frame 78, in plate units (r of width)
const P_START = 0.035, P_FRAMES_END = 0.7, P_ZOOM_END = 0.97;
const serveFrames = new Array(SERVE_COUNT);
let serveDir = "lg", serveLoaded = false, lastServeFrame = -1;

function loadServe() {
  if (serveLoaded) return;
  serveLoaded = true;
  serveDir = hiRes() ? "lg" : "sm";
  // load in a spread order so a fast scroller still finds a near frame
  const order = [];
  for (let step = 16; step >= 1; step = step >> 1)
    for (let i = 0; i < SERVE_COUNT; i += step) if (!order.includes(i)) order.push(i);
  order.forEach((i) => {
    const img = new Image();
    img.decoding = "async";
    img.src = `assets/serve/${serveDir}/${String(i).padStart(3, "0")}.webp`;
    img.onload = () => { serveFrames[i] = img; if (i === lastServeFrame) lastServeFrame = -1; };
  });
}

function nearestFrame(i) {
  for (let d = 0; d < SERVE_COUNT; d++) {
    if (serveFrames[i - d]) return serveFrames[i - d];
    if (serveFrames[i + d]) return serveFrames[i + d];
  }
  return null;
}

function sizeCanvases() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  serveCanvas.width = Math.round(stage.offsetWidth * dpr);
  serveCanvas.height = Math.round(stage.offsetHeight * dpr);
  lastServeFrame = -1;
  hero.resize();
}

function drawServe(i) {
  if (i === lastServeFrame) return;
  const img = nearestFrame(i);
  if (!img) return;
  serveCtx.clearRect(0, 0, serveCanvas.width, serveCanvas.height);
  serveCtx.drawImage(img, 0, 0, serveCanvas.width, serveCanvas.height);
  if (serveFrames[i]) lastServeFrame = i;
}

// pointer parallax on the hero layers
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  pointer.tx = (e.clientX / vw) * 2 - 1;
  pointer.ty = (e.clientY / vh) * 2 - 1;
}, { passive: true });

function sectionProgress(el) {
  const r = el.getBoundingClientRect();
  return { p: clamp(-r.top / Math.max(1, r.height - vh)), top: r.top, bottom: r.bottom };
}

function updateServe(t) {
  const { p, bottom } = sectionProgress(serveSec);
  if (bottom < 0) { hero.pause(); return; }

  pointer.x = lerp(pointer.x, pointer.tx, 0.06);
  pointer.y = lerp(pointer.y, pointer.ty, 0.06);
  // touch screens get a slow drift instead of pointer parallax
  const px = matchMedia("(hover: hover)").matches ? pointer.x : Math.sin(t * 0.0004) * 0.5;
  const py = matchMedia("(hover: hover)").matches ? pointer.y : Math.cos(t * 0.0003) * 0.3;
  const settle = 1 - smooth(P_START, P_START + 0.1, p); // parallax relaxes once the serve starts
  layers.forEach((el) => {
    if (el === stageLayer) return;
    const d = parseFloat(el.dataset.depth);
    el.style.transform = `translate3d(${(-px * d * 34 * settle).toFixed(2)}px, ${(-py * d * 22 * settle).toFixed(2)}px, 0)`;
  });

  // hero loop vs serve frames
  const serving = p > P_START;
  if (serving) { hero.pause(); loadServe(); } else { hero.play(); hero.draw(); }
  heroCanvas.style.opacity = serving ? 0 : 1;
  serveCanvas.style.opacity = serving ? 1 : 0;
  const fi = Math.round(map(p, P_START, P_FRAMES_END) * (SERVE_COUNT - 1));
  if (serving) drawServe(fi);

  heroUI.style.opacity = 1 - smooth(0, 0.04, p);
  heroUI.style.pointerEvents = p > 0.02 ? "none" : "";

  const capVis = smooth(P_START, P_START + 0.05, p) * (1 - smooth(0.6, 0.68, p));
  captions.style.opacity = capVis;
  capSpans[0].classList.toggle("on", fi <= 28);
  capSpans[1].classList.toggle("on", fi > 28 && fi <= 52);
  capSpans[2].classList.toggle("on", fi > 52);

  // dolly into the ball once it fills the plate
  const z = map(p, P_FRAMES_END, P_ZOOM_END);
  const sw = stage.offsetWidth, sh = stage.offsetHeight;
  const ox = (vw - sw) / 2 + BALL_END.x * sw;
  const oy = (stage.parentElement.offsetHeight - sh) + BALL_END.y * sh;
  const reach = Math.hypot(Math.max(ox, vw - ox), Math.max(oy, vh - oy));
  const sMax = (reach / (BALL_END.r * sw)) * 1.15;
  const s = lerp(1, sMax, easeIn(z));
  const sx = (-px * 0.75 * 34 * settle), sy = (-py * 0.75 * 22 * settle);
  stageLayer.style.transformOrigin = `${ox}px ${oy}px`;
  stageLayer.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
  title.style.opacity = 1 - smooth(0.0, 0.5, z);
  title.style.transform = `translateY(-62%) scale(${(1 + p * 0.12).toFixed(4)})`;
  wipe.style.opacity = smooth(0.55, 0.95, z);
}

// ---------- numbers count up ----------
const counters = $$("[data-count]");
const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  countIO.unobserve(e.target);
  const end = +e.target.dataset.count, t0 = performance.now();
  const tick = (now) => {
    const k = clamp((now - t0) / 1300);
    e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.6 });
counters.forEach((c) => { if (!reduced) { c.textContent = "0"; countIO.observe(c); } });

// ---------- the week: court lines draw, the 3D ball bounces day to day ----------
const weekSec = $("#week");
const courtPaths = $$(".court-lines path");
const days = $$(".day");
const shadow = $(".ballshadow");
let marks = [];

function measureMarks() {
  const sy = scrollY;
  marks = days.map((d) => {
    const r = d.getBoundingClientRect();
    const right = parseFloat(getComputedStyle(d, "::after").right) || r.width * 0.06;
    return { x: r.right - right - 23, y: r.top + sy + r.height / 2 };
  });
}

function ballRadius() { return clamp(vw * 0.028, 18, 34); }

function weekBall(t) {
  const r = weekSec.getBoundingClientRect();
  if (r.bottom < -100 || r.top > vh) return null;
  const pw = clamp((vh - r.top) / (r.height + vh * 0.2));
  courtPaths.forEach((path, i) => {
    path.style.strokeDashoffset = (1 - smooth(0.05 + i * 0.08, 0.4 + i * 0.08, pw)).toFixed(4);
  });

  const line = scrollY + vh * 0.58; // the ball lands on a day as that day reaches 58% of the screen
  const R = ballRadius();
  const first = marks[0], last = marks[marks.length - 1];
  let gx, gy, h, squash = 0;
  if (line < first.y) {
    // hit in from off the right edge, landing on the first day
    const k = map(line, first.y - vh * 0.45, first.y);
    if (k <= 0) return null;
    gx = lerp(vw + R * 3, first.x, k);
    gy = first.y;
    h = (1 - k) * 120 + 4 * k * (1 - k) * 160;
  } else if (line >= last.y) {
    gx = last.x; gy = last.y; h = 0;
  } else {
    let i = 0;
    while (i < marks.length - 2 && line >= marks[i + 1].y) i++;
    const a = marks[i], b = marks[i + 1];
    const k = map(line, a.y, b.y);
    gx = lerp(a.x, b.x, k);
    gy = lerp(a.y, b.y, k);
    h = Math.sin(Math.PI * k) * Math.min(220, (b.y - a.y) * 0.9);
    squash = Math.max(0, 1 - Math.min(k, 1 - k) * 12);
  }
  days.forEach((d, i) => d.classList.toggle("hit", line >= marks[i].y));

  const groundY = gy - scrollY;
  const lift = h / 220; // 0 on the ground, ~1 at the top of an arc
  return {
    clipTop: r.top, // the ball only exists inside the clay, never over the orange above
    x: gx - h * 0.18,
    y: groundY - h * 0.55,
    r: R * (1 + lift * 0.45),
    squash: squash * (h < 4 ? 1 : 0),
    shadow: { x: gx + 6, y: groundY + R * 0.75, w: R * (2.6 - lift), o: 0.85 - lift * 0.5 },
  };
}

// ---------- anatomy strip ----------
const anatomySec = $("#serve-anatomy");
const strip = $("#strip");
const poses = $$(".pose", strip);
const stripBar = $(".strip-progress span");
poses.forEach((f, i) => { $("img", f).src = `assets/poses/${String(i).padStart(3, "0")}.webp`; });

function updateAnatomy() {
  const { p, top, bottom } = sectionProgress(anatomySec);
  if (bottom < 0 || top > vh) return;
  const travel = strip.scrollWidth - vw + vw * 0.08;
  strip.style.transform = `translate3d(${(-p * travel).toFixed(1)}px, 0, 0)`;
  stripBar.style.width = `${(p * 100).toFixed(2)}%`;
  poses.forEach((f) => {
    const r = f.getBoundingClientRect();
    const c = (r.left + r.width / 2 - vw * (small() ? 0.5 : 0.62)) / vw;
    const k = 1 - clamp(Math.abs(c) * 1.6);
    f.style.opacity = (0.45 + k * 0.55).toFixed(3);
    $("img", f).style.transform = `translateY(${((1 - k) * 18).toFixed(1)}px) scale(${(0.9 + k * 0.12).toFixed(3)})`;
  });
}

// ---------- centre court video ----------
const centreVideo = $(".centre-video");
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { centreVideo.preload = "auto"; centreVideo.play().catch(() => {}); }
  else centreVideo.pause();
}, { rootMargin: "200px 0px" }).observe(centreVideo);

// ---------- ticket cards tilt ----------
$$("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateZ(0)`;
  });
  card.addEventListener("pointerleave", () => { card.style.transform = ""; });
});

// ---------- sunset: the ball drops into the disc ----------
const sunsetSec = $("#sunset");
const sunsetDisc = $("#sunsetDisc");

function sunsetBall() {
  const r = sunsetSec.getBoundingClientRect();
  if (r.top > vh || r.bottom < 0) return null;
  const d = sunsetDisc.getBoundingClientRect();
  const cx = d.left + d.width / 2, cy = d.top + d.height * 0.5;
  const k = map(vh - r.top, vh * 0.15, vh * 0.95);
  if (k <= 0) return null;
  const R = ballRadius() * 1.6;
  const fall = easeIn(map(k, 0, 0.55));
  const sink = map(k, 0.55, 1);
  const startY = -R * 2;
  return {
    x: cx + (1 - fall) * vw * 0.18,
    y: lerp(startY, cy, fall),
    r: R * (1 - sink * 0.9),
    squash: 0,
    hideBelow: sink > 0.98,
  };
}

// ---------- nav ----------
const nav = $(".nav");
const lightSections = $$(".numbers, .tickets");
let lastY = scrollY;
function updateNav() {
  const y = scrollY;
  if (Math.abs(y - lastY) > 4) {
    nav.classList.toggle("is-hidden", y > lastY && y > vh * 0.5);
    lastY = y;
  }
  nav.classList.toggle("on-light", lightSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top < 40 && r.bottom > 40;
  }));
}

// ---------- ball renderer ----------
let ball = null;
try { ball = new Ball($("#ball3d")); } catch (err) { console.warn("3D ball disabled", err); }

function updateBall() {
  if (!ball) return;
  const s = weekBall() || sunsetBall();
  if (!s || s.hideBelow) {
    ball.set({ visible: false });
    shadow.style.opacity = 0;
  } else {
    ball.set({ visible: true, x: s.x, y: s.y, r: s.r, squash: s.squash, clipTop: Math.max(0, s.clipTop || 0) });
    if (s.shadow) {
      shadow.style.opacity = (s.shadow.y > s.clipTop ? s.shadow.o : 0).toFixed(3);
      const w = s.shadow.w, h = w * 0.36;
      shadow.style.transform = `translate3d(${(s.shadow.x - w / 2).toFixed(1)}px, ${(s.shadow.y - h / 2).toFixed(1)}px, 0) scale(${(w / 100).toFixed(3)}, ${(h / 100).toFixed(3)})`;
    } else shadow.style.opacity = 0;
  }
  ball.render();
}

// ---------- loop ----------
function resize() {
  vw = innerWidth; vh = innerHeight;
  sizeCanvases();
  measureMarks();
  ball && ball.resize();
}
addEventListener("resize", resize);
addEventListener("load", measureMarks);
document.fonts && document.fonts.ready.then(measureMarks);
resize();

function frame(t) {
  lenis && lenis.raf(t);
  updateServe(t);
  updateAnatomy();
  updateBall();
  updateNav();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// preload the serve once the hero is on screen and idle
if (window.requestIdleCallback) requestIdleCallback(loadServe, { timeout: 2500 });
else setTimeout(loadServe, 1500);

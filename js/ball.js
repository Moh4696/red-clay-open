// The page's one real-time 3D object: a felt tennis ball rendered by three.js into a fixed,
// full-screen transparent canvas. main.js positions it in CSS pixels every frame.
import * as THREE from "../vendor/three.module.min.js";

const FELT = "#f4a321";

// Tennis-ball seam on the unit sphere: a cos t + b cos 3t, a sin t - b sin 3t, 2 sqrt(ab) sin 2t
// (a + b = 1 keeps it on the sphere). The third component has the smallest reach (0.92), so it
// becomes the texture's pole axis and the seam never crosses a pole.
function seamPoint(t, a = 0.7, b = 0.3) {
  const x = a * Math.cos(t) + b * Math.cos(3 * t);
  const z = a * Math.sin(t) - b * Math.sin(3 * t);
  const y = 2 * Math.sqrt(a * b) * Math.sin(2 * t);
  return [x, y, z];
}

function feltTexture() {
  const W = 2048, H = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = FELT;
  g.fillRect(0, 0, W, H);

  // blotchy felt: soft light and dark specks
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const r = 1 + Math.random() * 3.5;
    const light = Math.random() < 0.5;
    g.fillStyle = light ? `rgba(255, 214, 120, ${0.05 + Math.random() * 0.12})`
                        : `rgba(196, 82, 18, ${0.05 + Math.random() * 0.1})`;
    g.beginPath();
    g.ellipse(x, y, r / Math.max(0.25, Math.sin((y / H) * Math.PI)), r, 0, 0, Math.PI * 2);
    g.fill();
  }

  // seam: a soft groove, then the cream line, stamped as ellipses widened toward the poles
  const stamp = (width, style) => {
    g.fillStyle = style;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const [x, y, z] = seamPoint((i / N) * Math.PI * 2);
      const theta = Math.acos(y);
      const phi = (Math.atan2(z, -x) + Math.PI * 2) % (Math.PI * 2);
      const u = (phi / (Math.PI * 2)) * W, v = (theta / Math.PI) * H;
      const stretch = 1 / Math.max(0.2, Math.sin(theta));
      for (const du of [-W, 0, W]) {
        g.beginPath();
        g.ellipse(u + du, v, width * stretch, width, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  };
  stamp(16, "rgba(150, 60, 14, 0.05)");
  stamp(9, "rgba(255, 240, 214, 0.5)");
  stamp(6, "rgba(255, 246, 228, 0.9)");

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function fuzzTexture() {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const img = g.createImageData(W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class Ball {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -20000, 20000);

    const material = new THREE.MeshPhysicalMaterial({
      map: feltTexture(),
      roughness: 0.92,
      bumpMap: fuzzTexture(),
      bumpScale: 1.6,
      sheen: 1,
      sheenColor: new THREE.Color("#ffd28a"),
      sheenRoughness: 0.55,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material);
    this.mesh.rotation.set(0.4, 0.3, 0.2);
    // the group carries position and squash in screen axes; the mesh inside only rolls
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.scene.add(this.group);

    this.scene.add(new THREE.HemisphereLight(0xffe6c8, 0x5a0d10, 1.15));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
    key.position.set(-0.5, 0.8, 0.9);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5a30, 1.6);
    rim.position.set(0.9, -0.3, -0.6);
    this.scene.add(rim);

    this.state = { x: 0, y: 0, r: 40, visible: false, squash: 0, clipTop: 0 };
    this.last = { x: 0, y: 0 };
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    Object.assign(this.camera, { left: 0, right: w, top: 0, bottom: -h });
    this.camera.updateProjectionMatrix();
  }

  set(next) {
    Object.assign(this.state, next);
  }

  render() {
    const s = this.state;
    if (!s.visible) {
      if (this.drawn) { this.renderer.setScissorTest(false); this.renderer.clear(); this.drawn = false; }
      return;
    }
    const m = this.mesh;
    // roll with travel: moving right spins around the vertical-ish axis, down around x
    const dx = s.x - this.last.x, dy = s.y - this.last.y;
    m.rotation.y += dx / Math.max(s.r, 1) * 0.9;
    m.rotation.x += dy / Math.max(s.r, 1) * 0.9;
    m.rotation.z += 0.002;
    this.last.x = s.x; this.last.y = s.y;

    const sq = s.squash || 0;
    // clipTop: hide everything above this screen y (the edge of the section the ball lives in)
    const clip = Math.min(this.h, Math.max(0, s.clipTop || 0));
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    if (clip > 0) {
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(0, 0, this.w, this.h - clip);
    }
    this.group.position.set(s.x, -s.y, 0);
    this.group.scale.set(s.r * (1 + sq * 0.12), s.r * (1 - sq * 0.16), s.r);
    this.renderer.render(this.scene, this.camera);
    this.drawn = true;
  }
}

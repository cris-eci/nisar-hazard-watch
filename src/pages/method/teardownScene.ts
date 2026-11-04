import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Group,
  HemisphereLight,
  LatheGeometry,
  LinearMipmapLinearFilter,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Points,
  PointsMaterial,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { stepBlend, TEARDOWN_STEPS, type TeardownPart } from "@/pages/method/teardownSteps";

export type TeardownScene = {
  /** Draws one frame for scroll progress p (0 → steps − 1); returns the callout's screen point. */
  render: (p: number) => { x: number; y: number } | undefined;
  /** Adds a horizontal drag, in pixels, to the camera's yaw. */
  drag: (dx: number) => void;
  dispose: () => void;
};

type PartGroup = {
  group: Group;
  home: Vector3;
  explode: Vector3;
  materials: { material: Material; opacity: number; depthWrite: boolean }[];
};

const MAX_PIXEL_RATIO = 2;
const DRAG_YAW = 0.006;

// The reference model is stylised and built from primitives; proportions are approximate.
export const createTeardownScene = (host: HTMLElement, reducedMotion: boolean): TeardownScene => {
  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.display = "block";
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 900);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new HemisphereLight(0xbcc8dc, 0x070b14, 0.35));
  const key = new DirectionalLight(0xfff0d6, 3.2);
  key.position.set(14, 18, 20);
  scene.add(key);
  const rim = new DirectionalLight(0x8fb0e6, 1.4);
  rim.position.set(-18, 4, -14);
  scene.add(rim);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const canvasTexture = (
    size: number,
    draw: (g: CanvasRenderingContext2D, size: number) => void,
    repeat: [number, number] = [1, 1],
    srgb = true,
  ): Texture => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (context !== null) draw(context, size);
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(...repeat);
    if (srgb) texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  };

  // A fixed seed so the foil and the stars look the same on every visit.
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const foil = canvasTexture(
    512,
    (g, s) => {
      g.fillStyle = "#a9864a";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        g.fillStyle =
          random() > 0.5
            ? `rgba(255,226,160,${0.05 + random() * 0.12})`
            : `rgba(60,38,10,${0.05 + random() * 0.14})`;
        g.beginPath();
        const x = random() * s;
        const y = random() * s;
        g.moveTo(x, y);
        for (let k = 0; k < 3; k++) g.lineTo(x + (random() - 0.5) * 90, y + (random() - 0.5) * 90);
        g.fill();
      }
    },
    [1.5, 1.5],
  );
  const cells = canvasTexture(512, (g, s) => {
    g.fillStyle = "#7d8591";
    g.fillRect(0, 0, s, s);
    const n = 8;
    const cell = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const gradient = g.createLinearGradient(
          x * cell,
          y * cell,
          x * cell + cell,
          y * cell + cell,
        );
        gradient.addColorStop(0, "#1d2f5c");
        gradient.addColorStop(1, "#0b1530");
        g.fillStyle = gradient;
        g.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6);
        g.fillStyle = "rgba(160,175,200,0.35)";
        for (let k = 1; k < 5; k++) {
          g.fillRect(x * cell + 3, y * cell + 3 + (k * (cell - 6)) / 5, cell - 6, 1);
        }
      }
    }
  });
  const tiles = canvasTexture(256, (g, s) => {
    g.fillStyle = "#1a2230";
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? "#2b3648" : "#323e52";
        g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
        g.fillStyle = "#c9b48b";
        g.fillRect(x * 32 + 14, y * 32 + 14, 4, 4);
      }
    }
  });
  const wireMesh = canvasTexture(
    512,
    (g, s) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(255,255,255,0.9)";
      g.lineWidth = 3;
      for (let i = 8; i < s; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, s);
        g.moveTo(0, i);
        g.lineTo(s, i);
        g.stroke();
      }
    },
    [6, 2],
    false,
  );
  wireMesh.minFilter = LinearMipmapLinearFilter;

  type MaterialOptions = {
    metalness?: number;
    roughness?: number;
    map?: Texture;
    bump?: Texture;
    bumpScale?: number;
    alpha?: Texture;
    opacity?: number;
    doubleSided?: boolean;
    envIntensity?: number;
  };
  const standard = (color: number, o: MaterialOptions = {}) =>
    new MeshStandardMaterial({
      color,
      metalness: o.metalness ?? 0.3,
      roughness: o.roughness ?? 0.6,
      map: o.map ?? null,
      bumpMap: o.bump ?? null,
      bumpScale: o.bumpScale ?? 1,
      alphaMap: o.alpha ?? null,
      transparent: true,
      opacity: o.opacity ?? 1,
      side: o.doubleSided === true ? DoubleSide : FrontSide,
      envMapIntensity: o.envIntensity ?? 1,
    });
  const gold = () =>
    standard(0xffffff, { metalness: 0.9, roughness: 0.32, map: foil, bump: foil, bumpScale: 2 });

  const parts = {} as Record<TeardownPart, PartGroup>;
  const part = (name: TeardownPart, home: Vector3, explode: Vector3): Group => {
    const group = new Group();
    group.position.copy(home);
    scene.add(group);
    parts[name] = { group, home, explode, materials: [] };
    return group;
  };

  // Bus: gold foil box with plates, a high-gain dish and star trackers.
  const bus = part("bus", new Vector3(0, 0, 0), new Vector3(0, -3, 0));
  bus.add(new Mesh(new BoxGeometry(2.4, 2, 2.4), gold()));
  const plate = new Mesh(
    new BoxGeometry(2.5, 0.12, 2.5),
    standard(0x5b6470, { metalness: 0.7, roughness: 0.35 }),
  );
  plate.position.y = 1.06;
  bus.add(plate);
  const basePlate = plate.clone();
  basePlate.position.y = -1.06;
  bus.add(basePlate);
  const highGain = new Mesh(
    new SphereGeometry(0.55, 32, 12, 0, Math.PI * 2, 0, 0.9),
    standard(0xd9d6cf, { metalness: 0.3, roughness: 0.4, doubleSided: true }),
  );
  highGain.rotation.z = Math.PI / 2;
  highGain.position.set(-1.25, -0.3, 0.4);
  bus.add(highGain);
  for (let k = 0; k < 2; k++) {
    const tracker = new Mesh(
      new BoxGeometry(0.35, 0.35, 0.5),
      standard(0x262c36, { metalness: 0.6, roughness: 0.3 }),
    );
    tracker.position.set(0.6 - k * 1.1, 0.75, 1.35);
    bus.add(tracker);
  }

  // Solar array: a yoke and four panels.
  const solar = part("solar", new Vector3(0, 0, -1.2), new Vector3(0, 0, -3.5));
  const yoke = new Mesh(
    new CylinderGeometry(0.06, 0.06, 1.2, 12),
    standard(0x9aa3ad, { metalness: 0.8, roughness: 0.3 }),
  );
  yoke.rotation.x = Math.PI / 2;
  yoke.position.z = -0.6;
  solar.add(yoke);
  for (let k = 0; k < 4; k++) {
    const frame = () => standard(0x8b939d, { metalness: 0.8 });
    const panel = new Mesh(new BoxGeometry(2.2, 0.05, 1.9), [
      frame(),
      frame(),
      standard(0xffffff, { metalness: 0.65, roughness: 0.22, map: cells }),
      standard(0x3a414c, { metalness: 0.4 }),
      frame(),
      frame(),
    ]);
    panel.position.z = -2.2 - k * 2;
    solar.add(panel);
  }

  // Radar instrument structure with the L-band and S-band feeds on its side.
  const radars = part("radars", new Vector3(0, 1.95, 0), new Vector3(0, 2.4, 0));
  radars.add(
    new Mesh(
      new CylinderGeometry(1.25, 1.25, 1.8, 8),
      standard(0xb7bec7, { metalness: 0.85, roughness: 0.28 }),
    ),
  );
  const band = new Mesh(
    new TorusGeometry(1.27, 0.04, 8, 8),
    standard(0x5b6470, { metalness: 0.8 }),
  );
  band.rotation.x = Math.PI / 2;
  band.rotation.z = Math.PI / 8;
  band.position.y = 0.9;
  radars.add(band);
  const feeds = new Group();
  const feedsHome = new Vector3(1.3, 0.1, 0);
  const feedsExplode = new Vector3(1.8, 0, 0);
  feeds.position.copy(feedsHome);
  radars.add(feeds);
  const side = () => standard(0x3a414c);
  const lBand = new Mesh(new BoxGeometry(0.14, 1.1, 2.6), [
    standard(0xffffff, { metalness: 0.5, roughness: 0.45, map: tiles }),
    side(),
    side(),
    side(),
    side(),
    side(),
  ]);
  lBand.position.y = -0.25;
  feeds.add(lBand);
  const sBand = new Mesh(new BoxGeometry(0.14, 0.5, 1.2), gold());
  sBand.position.set(0, 0.6, 0);
  feeds.add(sBand);

  // Boom: four truss segments that spread apart as the model explodes.
  const boomBase = new Vector3(1.2, 2.75, 0);
  const boomDirection = new Vector3(0.924, 0.382, 0).normalize();
  const boom = part("boom", boomBase.clone(), new Vector3(1.6, 1.2, 0));
  const boomAxis = new Group();
  boomAxis.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), boomDirection);
  boom.add(boomAxis);
  const strut = standard(0xe8e5de, { metalness: 0.15, roughness: 0.45 });
  const joint = standard(0x8b939d, { metalness: 0.9, roughness: 0.25 });
  const segments: { group: Group; x: number }[] = [];
  for (let k = 0; k < 4; k++) {
    const segment = new Group();
    for (let j = 0; j < 3; j++) {
      const angle = (j / 3) * Math.PI * 2;
      const longeron = new Mesh(new CylinderGeometry(0.035, 0.035, 2.1, 8), strut);
      longeron.rotation.z = Math.PI / 2;
      longeron.position.set(1.1, Math.cos(angle) * 0.14, Math.sin(angle) * 0.14);
      segment.add(longeron);
    }
    for (let j = 0; j < 6; j++) {
      const diagonal = new Mesh(new CylinderGeometry(0.018, 0.018, 0.42, 6), strut);
      diagonal.position.set(0.18 + j * 0.35, 0, 0);
      diagonal.rotation.x = j % 2 ? 0.9 : -0.9;
      segment.add(diagonal);
    }
    const hinge = new Mesh(new CylinderGeometry(0.22, 0.22, 0.22, 16), joint);
    hinge.rotation.z = Math.PI / 2;
    segment.add(hinge);
    boomAxis.add(segment);
    segments.push({ group: segment, x: k * 2.25 });
  }

  // Reflector: a parabolic dish (radius 6, focal length 5) of gold skin, wire mesh and ribs.
  const reflector = part(
    "reflector",
    boomBase.clone().add(boomDirection.clone().multiplyScalar(9.1)),
    new Vector3(4.5, 3, 0),
  );
  const dish = new Group();
  dish.quaternion.setFromUnitVectors(
    new Vector3(0, 1, 0),
    boomDirection
      .clone()
      .negate()
      .add(new Vector3(0, -0.15, 0))
      .normalize(),
  );
  reflector.add(dish);
  const focal = 5;
  const profile: Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const r = (6 * i) / 32;
    profile.push(new Vector2(r, (r * r) / (4 * focal)));
  }
  const dishGeometry = new LatheGeometry(profile, 96);
  dish.add(
    new Mesh(
      dishGeometry,
      standard(0xd6b878, { metalness: 1, roughness: 0.35, opacity: 0.16, doubleSided: true }),
    ),
  );
  const wire = new Mesh(
    dishGeometry,
    standard(0xe9cf92, {
      metalness: 1,
      roughness: 0.3,
      alpha: wireMesh,
      doubleSided: true,
      opacity: 0.5,
    }),
  );
  wire.material.depthWrite = false;
  dish.add(wire);
  const ribPoints: number[] = [];
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    for (let i = 0; i < 16; i++) {
      const r0 = (6 * i) / 16;
      const r1 = (6 * (i + 1)) / 16;
      ribPoints.push(
        r0 * Math.cos(angle),
        (r0 * r0) / 20,
        r0 * Math.sin(angle),
        r1 * Math.cos(angle),
        (r1 * r1) / 20,
        r1 * Math.sin(angle),
      );
    }
  }
  const ribGeometry = new BufferGeometry();
  ribGeometry.setAttribute("position", new Float32BufferAttribute(ribPoints, 3));
  dish.add(
    new LineSegments(
      ribGeometry,
      new LineBasicMaterial({ color: 0xf1e4c2, transparent: true, opacity: 0.9 }),
    ),
  );
  const rimRing = new Mesh(new TorusGeometry(6, 0.07, 8, 128), joint);
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = 1.8;
  dish.add(rimRing);
  const hub = new Mesh(
    new CylinderGeometry(0.4, 0.5, 0.4, 24),
    standard(0x5b6470, { metalness: 0.6, roughness: 0.5, envIntensity: 0.4 }),
  );
  hub.position.y = -0.1;
  dish.add(hub);

  // Earth below, with a Fresnel atmosphere, and a star field.
  const earthTexture = new TextureLoader().load("/landing/earth-day.jpg");
  earthTexture.colorSpace = SRGBColorSpace;
  earthTexture.anisotropy = anisotropy;
  const earth = new Mesh(
    new SphereGeometry(90, 128, 96),
    new MeshStandardMaterial({
      map: earthTexture,
      emissiveMap: earthTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.2,
    }),
  );
  earth.position.set(5, -108, -10);
  earth.rotation.set(0.5, 2.6, 0);
  scene.add(earth);
  const atmosphere = new Mesh(
    new SphereGeometry(90.4, 128, 96),
    new ShaderMaterial({
      transparent: true,
      side: FrontSide,
      blending: AdditiveBlending,
      depthWrite: false,
      vertexShader:
        "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }",
      fragmentShader:
        "varying vec3 vN; varying vec3 vP; void main(){ float f = pow(clamp(1.0 - dot(normalize(-vP), vN), 0.0, 1.0), 4.5); gl_FragColor = vec4(0.42,0.6,0.95,1.0)*f*0.55; }",
    }),
  );
  atmosphere.position.copy(earth.position);
  scene.add(atmosphere);

  const starPoints: number[] = [];
  for (let i = 0; i < 2600; i++) {
    const u = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const ring = 500 * Math.sqrt(1 - u * u);
    starPoints.push(ring * Math.cos(angle), 500 * u, ring * Math.sin(angle));
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new Float32BufferAttribute(starPoints, 3));
  scene.add(
    new Points(
      starGeometry,
      new PointsMaterial({
        color: 0xcfd6e6,
        size: 1.3,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.7,
      }),
    ),
  );

  // The radar beam and its footprint, shown in the last step.
  const beamGeometry = new ConeGeometry(8, 22, 64, 1, true);
  beamGeometry.translate(0, -11, 0);
  const beam = new Mesh(
    beamGeometry,
    new MeshBasicMaterial({
      color: 0xebe9e4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    }),
  );
  beam.position.set(8.5, 5, 0);
  beam.rotation.z = -0.2;
  scene.add(beam);
  const footprint = new Mesh(
    new CircleGeometry(1, 64),
    new MeshBasicMaterial({
      color: 0xebe9e4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  footprint.scale.set(10, 4.5, 1);
  footprint.rotation.x = -Math.PI / 2;
  footprint.position.set(13, -17.6, 0);
  scene.add(footprint);

  const materialsOf = (object: Object3D): Material[] => {
    const found: Material[] = [];
    object.traverse((child) => {
      if (child instanceof Mesh || child instanceof LineSegments) {
        const material: Material | Material[] = child.material;
        found.push(...(Array.isArray(material) ? material : [material]));
      }
    });
    return found;
  };
  for (const entry of Object.values(parts)) {
    entry.materials = materialsOf(entry.group).map((material) => ({
      material,
      opacity: material.opacity,
      depthWrite: material.depthWrite,
    }));
  }

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let yaw = 0;
  let yawTarget = 0;
  const start = performance.now();
  const point = new Vector3();
  const look = new Vector3();
  const steps = TEARDOWN_STEPS;

  const render = (p: number) => {
    const i = Math.max(0, Math.min(steps.length - 2, Math.floor(p)));
    const a = steps[i];
    const b = steps[i + 1];
    if (a === undefined || b === undefined) return undefined;
    // Reduced motion cuts between steps instead of moving through them.
    const t = reducedMotion ? (p - i >= 0.5 ? 1 : 0) : stepBlend(p - i);
    const mix = (from: number, to: number) => from + (to - from) * t;

    const exploded = mix(a.exploded, b.exploded);
    const focusOpacity = (name: TeardownPart) =>
      mix((a.focus?.includes(name) ?? true) ? 1 : 0.1, (b.focus?.includes(name) ?? true) ? 1 : 0.1);
    for (const [name, entry] of Object.entries(parts) as [TeardownPart, PartGroup][]) {
      entry.group.position.copy(entry.home).addScaledVector(entry.explode, exploded);
      const opacity = focusOpacity(name);
      for (const m of entry.materials) {
        m.material.opacity = m.opacity * opacity;
        m.material.depthWrite = m.depthWrite && opacity > 0.6;
      }
    }
    feeds.position.copy(feedsHome).addScaledVector(feedsExplode, exploded);
    segments.forEach(({ group, x }, k) => {
      group.position.x = x + k * 0.55 * exploded;
    });
    const beamAmount = mix(a.beam, b.beam);
    beam.material.opacity = 0.07 * beamAmount;
    footprint.material.opacity = 0.22 * beamAmount;

    const time = (performance.now() - start) / 1000;
    const sway = reducedMotion ? 0 : Math.sin(time * 0.25) * 0.12;
    if (!reducedMotion) earth.rotation.y = 2.6 + time * 0.004;
    yaw += (yawTarget - yaw) * 0.12;

    const d = mix(a.camera.d, b.camera.d);
    const az = mix(a.camera.az, b.camera.az) + yaw + sway;
    const el = mix(a.camera.el, b.camera.el);
    look.set(
      mix(a.camera.look[0], b.camera.look[0]),
      mix(a.camera.look[1], b.camera.look[1]),
      mix(a.camera.look[2], b.camera.look[2]),
    );
    camera.position.set(
      look.x + d * Math.sin(az) * Math.cos(el),
      look.y + d * Math.sin(el),
      look.z + d * Math.cos(az) * Math.cos(el),
    );
    camera.lookAt(look);
    renderer.render(scene, camera);

    const near = steps[Math.max(0, Math.min(steps.length - 1, Math.round(p)))];
    const target = near?.callout;
    if (target === undefined) return undefined;
    if (target === "radars") feeds.getWorldPosition(point);
    else parts[target].group.getWorldPosition(point);
    if (target === "reflector") point.add(new Vector3(-1, 2.5, 0));
    if (target === "boom") point.add(new Vector3(4.2, 1.7, 0));
    point.project(camera);
    return {
      x: ((point.x + 1) / 2) * host.clientWidth,
      y: ((1 - point.y) / 2) * host.clientHeight,
    };
  };

  const dispose = () => {
    resizeObserver.disconnect();
    scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof LineSegments || object instanceof Points) {
        object.geometry.dispose();
        const material: Material | Material[] = object.material;
        for (const m of Array.isArray(material) ? material : [material]) m.dispose();
      }
    });
    for (const texture of [foil, cells, tiles, wireMesh, earthTexture]) texture.dispose();
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    render,
    drag: (dx) => {
      yawTarget += dx * DRAG_YAW;
    },
    dispose,
  };
};

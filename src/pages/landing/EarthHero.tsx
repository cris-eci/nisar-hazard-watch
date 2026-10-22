import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  FrontSide,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";

// NASA Blue Marble with its cloud layer, an atmosphere and a starfield. `cloudCover` (0..1) is
// driven by scroll: the clouds dissolve as the reader moves on, which is the page's claim made visible.

type EarthHeroProps = {
  cloudCover: { current: number };
  reducedMotion: boolean;
};

const SPIN_PER_FRAME = 0.0009;
const STAR_COUNT = 4200;
const SUN_DIRECTION = new Vector3(-3.2, 0.9, 1.5).normalize();
const AIR = new Color("#8db4ff");

// Fresnel rim: bright where the surface turns away from the viewer, stronger on the sunlit side.
const atmosphereShader = (
  power: number,
  strength: number,
  side: typeof BackSide | typeof FrontSide,
) =>
  new ShaderMaterial({
    uniforms: {
      colour: { value: AIR },
      sun: { value: SUN_DIRECTION },
      power: { value: power },
      strength: { value: strength },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: `
      uniform vec3 colour;
      uniform vec3 sun;
      uniform float power;
      uniform float strength;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        float facing = dot(vNormal, vView);
        float rim = ${side === BackSide ? "pow(clamp(facing + 0.62, 0.0, 1.0), power)" : "pow(1.0 - clamp(facing, 0.0, 1.0), power)"};
        float lit = 0.18 + 0.82 * smoothstep(-0.35, 0.6, dot(vWorldNormal, sun));
        gl_FragColor = vec4(colour * rim * lit * strength, rim * lit);
      }`,
    side,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

// A soft, wide halo behind the planet: the blur NASA's own renders have around Earth.
const haloTexture = (): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context !== null) {
    const glow = context.createRadialGradient(128, 128, 40, 128, 128, 128);
    glow.addColorStop(0, "rgba(141, 180, 255, 0.55)");
    glow.addColorStop(0.42, "rgba(110, 150, 230, 0.16)");
    glow.addColorStop(1, "rgba(80, 110, 200, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 256, 256);
  }
  return new CanvasTexture(canvas);
};

const starfield = (pixelRatio: number): { points: Points; time: { value: number } } => {
  const positions: number[] = [];
  const sizes: number[] = [];
  const tints: number[] = [];
  const phases: number[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    // Uniform on a far sphere, so no clumping at the poles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    positions.push(r * Math.cos(theta) * 60, u * 60, r * Math.sin(theta) * 60);
    const bright = Math.random() ** 6;
    sizes.push(0.8 + bright * 3.2);
    // Mostly cool white, a few warm: real stars are not all the same colour.
    const warm = Math.random() < 0.18;
    tints.push(warm ? 1 : 0.82, warm ? 0.9 : 0.88, warm ? 0.74 : 1);
    phases.push(Math.random() * Math.PI * 2);
  }
  const time = { value: 0 };
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("size", new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("tint", new Float32BufferAttribute(tints, 3));
  geometry.setAttribute("phase", new Float32BufferAttribute(phases, 1));
  const material = new ShaderMaterial({
    uniforms: { time, pixelRatio: { value: pixelRatio } },
    vertexShader: `
      attribute float size;
      attribute vec3 tint;
      attribute float phase;
      uniform float time;
      uniform float pixelRatio;
      varying vec3 vTint;
      varying float vAlpha;
      void main() {
        vTint = tint;
        vAlpha = 0.45 + 0.55 * (0.5 + 0.5 * sin(time * 0.9 + phase)) * min(1.0, size / 1.6);
        gl_PointSize = size * pixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vTint;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vTint, a);
      }`,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  return { points: new Points(geometry, material), time };
};

export const EarthHero = ({ cloudCover, reducedMotion }: EarthHeroProps) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 200);
    camera.position.set(0, 0, 4.4);

    const loader = new TextureLoader();
    const day = loader.load("/landing/earth-day.jpg");
    day.colorSpace = SRGBColorSpace;
    const clouds = loader.load("/landing/earth-clouds.jpg");
    const halo = haloTexture();

    const earth = new Mesh(
      new SphereGeometry(1, 128, 128),
      new MeshPhongMaterial({ map: day, shininess: 10, specular: new Color("#1c2a44") }),
    );
    // The cloud texture is white on black, so it doubles as its own alpha.
    const cloudMaterial = new MeshPhongMaterial({
      map: clouds,
      alphaMap: clouds,
      transparent: true,
      depthWrite: false,
    });
    const cloudShell = new Mesh(new SphereGeometry(1.012, 128, 128), cloudMaterial);
    // Start over the Americas (Colombia faces the reader), tilted like Earth's axis.
    earth.rotation.set(0.32, -0.25, 0);
    cloudShell.rotation.copy(earth.rotation);

    const rim = new Mesh(new SphereGeometry(1.016, 96, 96), atmosphereShader(3.2, 1.1, FrontSide));
    const air = new Mesh(new SphereGeometry(1.16, 96, 96), atmosphereShader(5.0, 1.4, BackSide));
    const glow = new Sprite(
      new SpriteMaterial({
        map: halo,
        blending: AdditiveBlending,
        depthWrite: false,
        opacity: 0.85,
      }),
    );
    glow.scale.setScalar(5.2);
    glow.position.z = -1.2;

    const stars = starfield(pixelRatio);
    scene.add(stars.points, glow, earth, cloudShell, rim, air);

    const sun = new DirectionalLight(0xffffff, 3.1);
    sun.position.copy(SUN_DIRECTION).multiplyScalar(5);
    scene.add(sun, new AmbientLight(0x9fb4ff, 0.07));

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      // Landscape: the planet sits right of the title. Portrait: it rises from the bottom edge.
      const landscape = width / height > 1.05;
      camera.position.z = landscape ? 5.6 : Math.max(3.4, (3 * height) / width);
      if (landscape)
        camera.setViewOffset(width, height, -width * 0.21, height * 0.02, width, height);
      else camera.setViewOffset(width, height, 0, -height * 0.37, width, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const started = performance.now();
    const render = () => {
      cloudMaterial.opacity = Math.max(0, Math.min(1, cloudCover.current));
      if (!reducedMotion) {
        earth.rotation.y += SPIN_PER_FRAME;
        cloudShell.rotation.y += SPIN_PER_FRAME * 1.25;
        stars.points.rotation.y += SPIN_PER_FRAME * 0.04;
        stars.time.value = (performance.now() - started) / 1000;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      day.dispose();
      clouds.dispose();
      halo.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [cloudCover, reducedMotion]);

  return (
    <div
      ref={hostRef}
      className="l-hero__space"
      role="img"
      aria-label="Earth turning under its cloud cover in a field of stars, from NASA Blue Marble imagery"
    />
  );
};

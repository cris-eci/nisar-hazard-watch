import { useEffect, useRef } from "react";
import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from "three";

// NASA Blue Marble with its cloud layer. `cloudCover` (0..1) is driven by scroll: the clouds dissolve
// as the reader moves on, which is the page's claim made visible.

type EarthHeroProps = {
  cloudCover: { current: number };
  reducedMotion: boolean;
};

const SPIN_PER_FRAME = 0.0012;

export const EarthHero = ({ cloudCover, reducedMotion }: EarthHeroProps) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.75);

    const loader = new TextureLoader();
    const day = loader.load("/landing/earth-day.jpg");
    day.colorSpace = SRGBColorSpace;
    const clouds = loader.load("/landing/earth-clouds.jpg");

    const earth = new Mesh(
      new SphereGeometry(1, 96, 96),
      new MeshPhongMaterial({ map: day, shininess: 6 }),
    );
    // The cloud texture is white on black, so it doubles as its own alpha.
    const cloudMaterial = new MeshPhongMaterial({
      map: clouds,
      alphaMap: clouds,
      transparent: true,
      depthWrite: false,
    });
    const cloudShell = new Mesh(new SphereGeometry(1.012, 96, 96), cloudMaterial);
    // Start over the Americas (Colombia faces the reader), tilted like Earth's axis.
    earth.rotation.set(0.32, -0.25, 0);
    cloudShell.rotation.copy(earth.rotation);
    scene.add(earth, cloudShell);

    const sun = new DirectionalLight(0xffffff, 2.6);
    sun.position.set(-3, 1.4, 2.6);
    scene.add(sun, new AmbientLight(0xffffff, 0.35));

    const resize = () => {
      const size = Math.max(1, host.clientWidth);
      renderer.setSize(size, size, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const render = () => {
      cloudMaterial.opacity = Math.max(0, Math.min(1, cloudCover.current));
      if (!reducedMotion) {
        earth.rotation.y += SPIN_PER_FRAME;
        cloudShell.rotation.y += SPIN_PER_FRAME * 1.25;
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
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [cloudCover, reducedMotion]);

  return (
    <div
      ref={hostRef}
      className="l-hero__earth"
      role="img"
      aria-label="Earth turning under its cloud cover, from NASA Blue Marble imagery"
    />
  );
};

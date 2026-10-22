import { Vector3 } from "three";

const toRad = Math.PI / 180;

// Point on a three.js SphereGeometry (equirectangular map) in the sphere's own frame.
export const lonLatToVec = (lon: number, lat: number, radius = 1): Vector3 => {
  const phi = (lon + 180) * toRad;
  const theta = (90 - lat) * toRad;
  return new Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
};

// Euler angles (XYZ order) that turn lon/lat to face a camera on +Z, north up.
export const facingRotation = (lon: number, lat: number): { x: number; y: number } => {
  const { x, y, z } = lonLatToVec(lon, lat);
  const ry = Math.atan2(-x, z);
  const zAfterY = -x * Math.sin(ry) + z * Math.cos(ry);
  return { x: Math.atan2(y, zAfterY), y: ry };
};

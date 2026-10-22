export type Rgba = [number, number, number, number];

// Paints a square image pixel by pixel; the demo serves it as a data: URL like a pipeline PNG.
export const toPngUrl = (size: number, paint: (pixel: number) => Rgba): string => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D is not available");
  const image = context.createImageData(size, size);
  for (let i = 0; i < size * size; i++) image.data.set(paint(i), i * 4);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
};

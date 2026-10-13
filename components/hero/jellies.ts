// Shared definition of the three Jellies — used by both the WebGL scene and the SVG fallback.
// Colours come from 07_DESIGN_TOKENS.json gradients (light → mid → deep).

export type JellyKind = "blue" | "green" | "heat";

export const JELLIES: Record<
  JellyKind,
  { meaning: string; colors: [string, string, string]; shape: [number, number, number]; bend: number; wobble: number; size: number; rotation: number }
> = {
  blue: { meaning: "speed, technology, scaling", colors: ["#13C8FF", "#306BFF", "#6B38FF"], shape: [1.5, 1.0, 0.9], bend: 0.16, wobble: 0.07, size: 1.0, rotation: 0.4 },
  green: { meaning: "people, growth, opportunity", colors: ["#D7FF54", "#8DFF45", "#00D47E"], shape: [1.35, 0.95, 0.85], bend: -0.2, wobble: 0.09, size: 0.92, rotation: -0.45 },
  heat: { meaning: "energy, human connection, impact", colors: ["#FFD25A", "#FF9A31", "#FF4D5E"], shape: [1.3, 1.0, 0.9], bend: 0.1, wobble: 0.06, size: 0.95, rotation: -0.25 },
};

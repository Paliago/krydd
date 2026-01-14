export const baseColors = [
  {
    name: "default",
    label: "Darkmatter",
    activeColor: {
      light: "oklch(0.6716 0.1368 48.513)",
      dark: "oklch(0.7214 0.1337 49.9802)",
    },
  },
  {
    name: "shadcn-slate",
    label: "Shadcn Slate",
    activeColor: {
      light: "oklch(0.21 0.006 285.885)",
      dark: "oklch(0.92 0.004 286.32)",
    },
  },
  {
    name: "kodama-grove",
    label: "Kodama Grove",
    activeColor: {
      light: "oklch(0.67 0.11 118.91)",
      dark: "oklch(0.68 0.06 132.45)",
    },
  },
  {
    name: "claude",
    label: "Claude",
    activeColor: {
      light: "oklch(0.56 0.13 43)",
      dark: "oklch(0.56 0.13 43)",
    },
  },
  {
    name: "candyland",
    label: "Candyland",
    activeColor: {
      light: "oklch(0.8677 0.0735 7.0855)",
      dark: "oklch(0.8027 0.1355 349.2347)",
    },
  },
  {
    name: "catppuccin",
    label: "Catppuccin",
    activeColor: {
      light: "oklch(0.5547 0.2503 297.0156)",
      dark: "oklch(0.7871 0.1187 304.7693)",
    },
  },
  {
    name: "ocean-breeze",
    label: "Ocean Breeze",
    activeColor: {
      light: "oklch(0.7227 0.1920 149.5793",
      dark: "oklch(0.7729 0.1535 163.2231)",
    },
  },
  {
    name: "pastel-dreams",
    label: "Pastel Dreams",
    activeColor: {
      light: "oklch(0.9073 0.053 306.0902)",
      dark: "oklch(0.7874 0.1179 295.7538)",
    },
  },
  {
    name: "vintage-paper",
    label: "Vintage Paper",
    activeColor: {
      light: "oklch(0.6180 0.0778 65.5444)",
      dark: "oklch(0.7264 0.0581 66.6967)",
    },
  },
] as const;

export type BaseColor = (typeof baseColors)[number];

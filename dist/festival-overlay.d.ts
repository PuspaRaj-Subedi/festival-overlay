export interface Color {
  r: number;
  g: number;
  b: number;
}

export type Intensity = 'low' | 'medium' | 'high';

export interface Options {
  festival?: string;
  intensity?: Intensity;
  zIndex?: number;
  opacity?: number;
  duration?: number;
  container?: string | HTMLElement;
  banner?: boolean | string;
  colors?: Color[];
  date?: Date | string;
  calendarUrl?: string | false;
  respectReducedMotion?: boolean;
  onStart?: () => void;
  onStop?: () => void;
}

export interface Particle {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  size?: number;
  life?: number;
  maxLife?: number;
  kind?: string;
  color?: string;
  [key: string]: any;
}

export interface ThemeState {
  width: number;
  height: number;
  dpr: number;
  palette: Color[];
  time?: number;
  [key: string]: any;
}

export interface ThemeCaps {
  low: number;
  medium: number;
  high: number;
}

export interface Theme {
  id: string;
  name: string;
  greeting?: string;
  palette: Color[];
  caps: ThemeCaps;
  init?: (ctx: CanvasRenderingContext2D, state: ThemeState) => void;
  spawn: (state: ThemeState) => Particle | null;
  update: (particle: Particle, dt: number, state: ThemeState) => boolean;
  draw: (ctx: CanvasRenderingContext2D, particle: Particle, state: ThemeState) => void;
  drawBackground?: (ctx: CanvasRenderingContext2D, state: ThemeState) => void;
  drawForeground?: (ctx: CanvasRenderingContext2D, state: ThemeState) => void;
}

export interface Controller {
  isRunning(): boolean;
  start(options?: Partial<Options>): Promise<Controller>;
  stop(): Controller;
  toggle(options?: Partial<Options>): Promise<Controller>;
  setFestival(themeId: string): Promise<Controller>;
}

export interface FestivalOverlayAPI {
  version: string;
  start(options?: Options): Promise<Controller>;
  stop(): Controller;
  toggle(options?: Options): Promise<Controller>;
  isRunning(): boolean;
  create(options?: Options): Controller;
  register(theme: Theme): void;
  readonly themes: string[];
  resolve(date?: Date | string, calendar?: object): string | null;
}

declare const FestivalOverlay: FestivalOverlayAPI;
export default FestivalOverlay;

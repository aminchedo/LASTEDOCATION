/// <reference types="vite/client" />

/**
 * Enhanced Vite Environment Type Definitions
 * Provides type safety for environment variables and modules
 */

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_PWA: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    readonly data: any;
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: readonly string[], cb: (mods: any[]) => void): void;
    dispose(cb: (data: any) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: any[]) => void): void;
  };
}

/**
 * Module declarations for various file types
 */

// CSS Modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Images
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.avif' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

// Fonts
declare module '*.woff' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.eot' {
  const src: string;
  export default src;
}

// Media
declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.flac' {
  const src: string;
  export default src;
}

declare module '*.aac' {
  const src: string;
  export default src;
}

// Data formats
declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.json5' {
  const value: any;
  export default value;
}

declare module '*.yaml' {
  const value: any;
  export default value;
}

declare module '*.yml' {
  const value: any;
  export default value;
}

declare module '*.toml' {
  const value: any;
  export default value;
}

// Web Workers
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// WebAssembly
declare module '*.wasm' {
  const initWasm: (imports: WebAssembly.Imports) => Promise<WebAssembly.Instance>;
  export default initWasm;
}

/**
 * Global type augmentations
 */

// Extend Window interface for custom properties
declare global {
  interface Window {
    __APP_VERSION__: string;
    __BUILD_TIME__: string;
    analytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
      page: (name: string, properties?: Record<string, any>) => void;
      identify: (userId: string, traits?: Record<string, any>) => void;
    };
  }

  // Custom CSS properties type safety
  interface CSSStyleDeclaration {
    '--c-primary': string;
    '--c-success': string;
    '--c-warning': string;
    '--c-error': string;
    '--c-bg': string;
    '--c-surface': string;
    '--c-text': string;
    '--c-border': string;
    '--c-muted': string;
  }
}

/**
 * React type augmentations
 */
declare module 'react' {
  interface CSSProperties {
    '--c-primary'?: string;
    '--c-success'?: string;
    '--c-warning'?: string;
    '--c-error'?: string;
    '--c-bg'?: string;
    '--c-surface'?: string;
    '--c-text'?: string;
    '--c-border'?: string;
    '--c-muted'?: string;
  }
}

/**
 * Utility types for better type inference
 */

// Strict extract utility
export type StrictExtract<T, U extends T> = T extends U ? T : never;

// Require at least one property
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Require exactly one property
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

// Deep partial
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Deep readonly
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

// Nullable type
export type Nullable<T> = T | null;

// Optional type
export type Optional<T> = T | undefined;

// Maybe type (both null and undefined)
export type Maybe<T> = T | null | undefined;

// Non-nullable utility
export type NonNullable<T> = T extends null | undefined ? never : T;

// Async function type
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

// Event handler type
export type EventHandler<T = any> = (event: T) => void;

// Callback type
export type Callback<T = void> = () => T;

export {};

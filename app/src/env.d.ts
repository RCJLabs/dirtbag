/// <reference types="vite/client" />

// From package.json, by vite.config.ts.
declare const __APP_VERSION__: string;

// The self-hosted fonts are CSS side-effect imports with no types of their own.
declare module '@fontsource/*';

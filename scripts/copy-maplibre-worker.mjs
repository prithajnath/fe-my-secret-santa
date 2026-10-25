// MapLibre runs tile parsing in a module worker that it locates via import.meta.url, which
// Next's bundler doesn't rewrite. Serve the installed worker from our own origin instead;
// group-map.tsx points maplibre at it with setWorkerUrl().
import { copyFileSync, mkdirSync } from "node:fs"

mkdirSync("public/vendor", { recursive: true })
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/vendor/maplibre-gl-worker.mjs")

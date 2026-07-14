// Copia el worker de pdfjs-dist a public/ para servirlo como asset estático propio,
// evitando la resolución vía `new URL(..., import.meta.url)` que falla en el dev
// server (Vite) en rutas de Windows con letra de unidad (p.ej. /@fs/C:/...).
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
const dest = new URL('../public/pdf.worker.min.mjs', import.meta.url);

copyFileSync(src, dest);
console.log('pdf.worker.min.mjs copiado a public/');

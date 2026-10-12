import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import esbuild from 'esbuild';

const DIST_DIR = path.resolve('dist');
const THEMES_DIST_DIR = path.resolve('dist/themes');

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function getSRI(buffer) {
  const hash = crypto.createHash('sha384').update(buffer).digest('base64');
  return `sha384-${hash}`;
}

function getGzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

async function build() {
  console.log('🚀 Building festival-overlay...\n');

  // Ensure clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(THEMES_DIST_DIR, { recursive: true });

  // 1. Copy static assets
  fs.copyFileSync('calendar/festivals.json', path.join(DIST_DIR, 'festivals.json'));
  fs.copyFileSync('src/festival-overlay.d.ts', path.join(DIST_DIR, 'festival-overlay.d.ts'));

  const umdBanner = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FestivalOverlay = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {`;

  const umdFooter = `
  if (typeof FestivalOverlay === 'object' && FestivalOverlay !== null) {
    if (FestivalOverlay.default && typeof FestivalOverlay.default.isRunning === 'function') {
      return FestivalOverlay.default;
    }
  }
  return FestivalOverlay;
}));`;

  // 2. Build main bundles
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.umd.js',
    format: 'iife',
    globalName: 'FestivalOverlay',
    banner: { js: umdBanner },
    footer: { js: umdFooter },
    minify: false,
    sourcemap: false
  });

  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.umd.min.js',
    format: 'iife',
    globalName: 'FestivalOverlay',
    banner: { js: umdBanner },
    footer: { js: umdFooter },
    minify: true,
    sourcemap: false
  });

  await esbuild.build({
    entryPoints: ['src/auto.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.auto.min.js',
    format: 'iife',
    minify: true,
    sourcemap: false
  });

  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.esm.js',
    format: 'esm',
    minify: false,
    sourcemap: false
  });

  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.esm.min.js',
    format: 'esm',
    minify: true,
    sourcemap: false
  });

  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/festival-overlay.cjs',
    format: 'cjs',
    minify: false,
    sourcemap: false
  });

  // 3. Build single theme ESM bundles
  const themeFiles = fs.readdirSync('src/themes').filter(f => f !== 'index.js' && f.endsWith('.js'));
  for (const themeFile of themeFiles) {
    const themeName = path.basename(themeFile, '.js');
    await esbuild.build({
      entryPoints: [`src/themes/${themeFile}`],
      bundle: true,
      outfile: `dist/themes/${themeName}.esm.js`,
      format: 'esm',
      minify: true,
      sourcemap: false
    });
  }

  // 4. Report sizes, SRI hashes, and verify size budget
  console.log('📦 Build Artifacts & Subresource Integrity (SRI):\n');
  console.log(
    'File'.padEnd(36) +
    'Size'.padEnd(12) +
    'Gzip'.padEnd(12) +
    'SRI (sha384)'
  );
  console.log('-'.repeat(100));

  let hasBudgetViolation = false;

  function processFile(relPath, maxGzipKb = null) {
    const fullPath = path.join(DIST_DIR, relPath);
    if (!fs.existsSync(fullPath)) return;

    const buf = fs.readFileSync(fullPath);
    const rawSize = buf.length;
    const gzipSize = getGzipSize(buf);
    const sri = getSRI(buf);

    const gzipKb = gzipSize / 1024;
    let warning = '';
    if (maxGzipKb !== null && gzipKb > maxGzipKb) {
      warning = ` ⚠️ EXCEEDS BUDGET (${maxGzipKb} KB)`;
      hasBudgetViolation = true;
    }

    console.log(
      relPath.padEnd(36) +
      formatBytes(rawSize).padEnd(12) +
      formatBytes(gzipSize).padEnd(12) +
      sri +
      warning
    );
  }

  processFile('festival-overlay.umd.min.js', 35); // Full bundle max 35 KB gzipped
  processFile('festival-overlay.umd.js');
  processFile('festival-overlay.auto.min.js', 35);
  processFile('festival-overlay.esm.js');
  processFile('festival-overlay.esm.min.js', 35);
  processFile('festival-overlay.cjs');
  processFile('festivals.json');
  processFile('festival-overlay.d.ts');

  console.log('\n🎨 Individual Theme Bundles:\n');
  for (const themeFile of themeFiles) {
    const themeName = path.basename(themeFile, '.js');
    processFile(`themes/${themeName}.esm.js`, 6); // Each theme max 6 KB gzipped
  }

  console.log('-'.repeat(100));

  if (hasBudgetViolation) {
    console.error('\n❌ Size budget check failed!');
    process.exit(1);
  } else {
    console.log('\n✅ Build completed successfully! All size budgets passed.\n');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

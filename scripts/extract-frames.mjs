// scripts/extract-frames.mjs
// Нарезает исходные mp4 (assets/s1.mp4, assets/s2.mp4) на WebP-последовательности
// в 3-х разрешениях. Кадр сохраняется по длинной стороне (fit inside), пропорции
// сохраняются. Секция 1 — видео на весь экран (птичка улетает). Секция 2 — видео
// на левой половине (птичка прилетает). Оба: 1284x716, 120 кадров, 30 fps.

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VIDEOS = [
  { src: 'assets/s1.mp4', name: 's1' }, // птичка улетает — секция 1
  { src: 'assets/s2.mp4', name: 's2' }, // птичка прилетает — секция 2
];

// FPS прореживания: видео 30 fps × 4 c = 120 кадров. Берём 20 fps → 80 кадров
// (как в Bali Starling) — плавность сохраняется, вес меньше.
const FPS = 20;

const SIZES = [
  { key: 'desktop', maxSide: 1440, quality: 80 },
  { key: 'tablet',  maxSide: 1000, quality: 78 },
  { key: 'mobile',  maxSide: 720,  quality: 76 },
];

const OUT_ROOT = join(ROOT, 'public/frames');
const TMP_ROOT = join(ROOT, 'scripts/_tmp');

function bytes(n) {
  if (n > 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  if (n > 1024) return (n / 1024).toFixed(1) + ' KB';
  return n + ' B';
}

for (const video of VIDEOS) {
  const srcPath = join(ROOT, video.src);

  for (const size of SIZES) {
    const tmpDir = join(TMP_ROOT, `${video.name}-${size.key}`);
    const outDir = join(OUT_ROOT, video.name, size.key);

    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(outDir, { recursive: true });

    console.log(`\n[ffmpeg] ${video.name} → ${size.key} (max ${size.maxSide}px)`);
    const ff = spawnSync('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-i', srcPath,
      '-vf', `fps=${FPS},scale=w=${size.maxSide}:h=${size.maxSide}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`,
      join(tmpDir, 'frame_%04d.png'),
    ], { stdio: 'inherit' });

    if (ff.status !== 0) {
      console.error('ffmpeg failed');
      process.exit(1);
    }

    const pngs = readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
    console.log(`[cwebp] ${pngs.length} frames → quality ${size.quality}`);

    for (const png of pngs) {
      const inFile = join(tmpDir, png);
      const outFile = join(outDir, png.replace('.png', '.webp'));
      const r = spawnSync('cwebp', [
        '-quiet',
        '-q', String(size.quality),
        '-m', '6',
        '-sharp_yuv',
        inFile, '-o', outFile,
      ]);
      if (r.status !== 0) {
        console.error(`cwebp failed on ${png}`);
        process.exit(1);
      }
    }

    rmSync(tmpDir, { recursive: true, force: true });

    const files = readdirSync(outDir).map(f => statSync(join(outDir, f)).size);
    const total = files.reduce((a, b) => a + b, 0);
    const avg = files.length ? Math.round(total / files.length) : 0;
    console.log(`  ✓ ${files.length} frames · total ${bytes(total)} · avg ${bytes(avg)}`);
  }
}

console.log('\n✅ done. Frames at public/frames/');

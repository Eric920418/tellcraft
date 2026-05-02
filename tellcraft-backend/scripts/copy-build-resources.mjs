// Build helper: copy non-TS resources from src/ and external/ into dist/
// Run after `tsc` because tsc only handles TypeScript files.
//
// What gets copied:
//   1. src/services/coder-handlers/*.md      → dist/services/coder-handlers/
//   2. src/services/ui-evaluator-rubric/*.md → dist/services/ui-evaluator-rubric/
//   3. external/awesome-design-md/design-md/*/DESIGN.md
//        → dist/external/awesome-design-md/design-md/{brand}/DESIGN.md
//      (only DESIGN.md files; preview HTML / README.md ignored to keep dist lean)
//
// design-md is git submodule and may be missing in CI sparse checkout.
// Treat that as a soft warning — design-md-loader has dual-path fallback.

import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();

function copyFlat(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`[copy-build-resources] required source missing: ${srcDir}`);
  }
  fs.mkdirSync(dstDir, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, f);
    const dstFile = path.join(dstDir, f);
    const stat = fs.statSync(srcFile);
    if (stat.isFile()) {
      fs.copyFileSync(srcFile, dstFile);
      n++;
    }
  }
  return n;
}

function copyDesignMd(srcRoot, dstRoot) {
  if (!fs.existsSync(srcRoot)) {
    console.warn(`[copy-build-resources] design-md submodule not found at ${srcRoot} — skipping (loader has src fallback)`);
    return 0;
  }
  fs.mkdirSync(dstRoot, { recursive: true });
  let n = 0;
  for (const brand of fs.readdirSync(srcRoot)) {
    const brandSrc = path.join(srcRoot, brand);
    if (!fs.statSync(brandSrc).isDirectory()) continue;
    const designSrc = path.join(brandSrc, 'DESIGN.md');
    if (!fs.existsSync(designSrc)) continue;
    const brandDst = path.join(dstRoot, brand);
    fs.mkdirSync(brandDst, { recursive: true });
    fs.copyFileSync(designSrc, path.join(brandDst, 'DESIGN.md'));
    n++;
  }
  return n;
}

const handlerCount = copyFlat(
  path.join(root, 'src', 'services', 'coder-handlers'),
  path.join(root, 'dist', 'services', 'coder-handlers'),
);
const rubricCount = copyFlat(
  path.join(root, 'src', 'services', 'ui-evaluator-rubric'),
  path.join(root, 'dist', 'services', 'ui-evaluator-rubric'),
);
const designMdCount = copyDesignMd(
  path.join(root, 'external', 'awesome-design-md', 'design-md'),
  path.join(root, 'dist', 'external', 'awesome-design-md', 'design-md'),
);

console.log(`[copy-build-resources] copied: handlers=${handlerCount}, rubrics=${rubricCount}, design-md=${designMdCount}`);

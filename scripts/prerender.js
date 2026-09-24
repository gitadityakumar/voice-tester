import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();

console.log('Building SSR bundle...');
execSync('npx vite build --ssr src/entry-server.tsx', { stdio: 'inherit' });

console.log('Pre-rendering App...');
const { render } = await import(path.join(rootDir, 'dist-ssr/entry-server.js'));
const appHtml = render();

const indexPath = path.join(rootDir, 'dist/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Inject the pre-rendered HTML into #root
indexHtml = indexHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

let mainScriptSrc = '';
indexHtml = indexHtml.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, src) => {
    mainScriptSrc = src;
    return '';
  },
);

const modulepreloads = [];
indexHtml = indexHtml.replace(/<link rel="modulepreload"[^>]*>/g, (match) => {
  modulepreloads.push(match);
  return '';
});

// Keep modulepreload in head for background downloading without blocking paint
indexHtml = indexHtml.replace('</head>', `  ${modulepreloads.join('\n  ')}\n</head>`);

// At the end of body, trigger hydration after the initial pre-rendered frame is painted
const hydrationScript = `
  <script type="module">
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        import('${mainScriptSrc}');
      });
    });
  </script>
`;

indexHtml = indexHtml.replace('</body>', `${hydrationScript}\n</body>`);

fs.writeFileSync(indexPath, indexHtml, 'utf-8');
console.log(
  `Injected ${appHtml.length} characters of pre-rendered HTML with rAF deferred hydration`,
);

// Clean up dist-ssr
fs.rmSync(path.join(rootDir, 'dist-ssr'), { recursive: true, force: true });
console.log('Prerender complete!');

import { mkdir, copyFile, readFile, access } from 'node:fs/promises';

const files = ['index.html', 'style.css', 'script.js', 'autocomplete.js', 'weather.js', 'favicon.svg'];
const root = new URL('./', import.meta.url);
const output = new URL('./dist/', root);
await mkdir(output, { recursive: true });
for (const file of files) {
  await copyFile(new URL(file, root), new URL(file, output));
}
const html = await readFile(new URL('index.html', output), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target = match[1];
  if (/^(?:https?:|data:|#)/.test(target) || target === './') continue;
  await access(new URL(target, output));
}
console.log('Static build ready: dist (' + files.length + ' files).');

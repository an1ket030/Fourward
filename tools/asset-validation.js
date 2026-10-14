import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const queue = ['index.html'];
const checked = new Set();
const missing = [];

function addReference(reference, owner) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) return;
  const target = path.normalize(path.join(path.dirname(path.join(root, owner)), reference));
  if (!target.startsWith(root + path.sep) && target !== root) {
    missing.push(`${owner}: reference escapes project root (${reference})`);
    return;
  }
  const relative = path.relative(root, target);
  if (!fs.existsSync(target)) missing.push(`${owner}: missing ${reference}`);
  else if (/\.js$/i.test(target) && !checked.has(relative)) queue.push(relative);
}

while (queue.length) {
  const relative = queue.shift();
  if (checked.has(relative)) continue;
  checked.add(relative);
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  if (relative === 'index.html') {
    for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) addReference(match[1], relative);
  }
  if (/\.js$/i.test(relative)) {
    for (const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) addReference(match[1], relative);
    for (const match of source.matchAll(/new\s+Worker\(["']([^"']+)["']/g)) addReference(match[1], 'index.html');
  }
}

if (missing.length) {
  console.error(missing.map(item => `FAIL ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS ${checked.size} entry/module files and all referenced local assets exist.`);
}

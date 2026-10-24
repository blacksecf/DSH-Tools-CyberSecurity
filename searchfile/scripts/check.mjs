import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relative) {
  return readFileSync(join(root, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relative) {
  try {
    statSync(join(root, relative));
    return true;
  } catch {
    return false;
  }
}

const pkg = JSON.parse(read('package.json'));

assert(typeof pkg.name === 'string' && pkg.name.length > 0, 'package.json name is missing');
assert(/^(\@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/.test(pkg.name), `invalid package name: ${pkg.name}`);
assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version), `invalid version: ${pkg.version}`);
assert(pkg.private === true, 'package.json should stay private unless you explicitly publish it');
assert(pkg.type === 'module', 'package.json type must be module');
assert(pkg.license === 'MIT', 'license must be MIT (or update scripts/check.mjs)');
assert(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch must point to cordis.patch.yml');
assert(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform must be web');
assert(pkg.dsh?.client?.immediately === true, 'dsh.client.immediately must be true');

const patch = read('cordis.patch.yml');
assert(patch.includes('id: file-search'), 'cordis.patch.yml is missing the file-search row');
assert(patch.includes(`name: '${pkg.name}'`), `cordis.patch.yml must name the package ${pkg.name}`);

const client = read('client.js');
const clientId = /window\.__ModuleLoader__\.load\(\{\s*id:\s*'([^']+)'/.exec(client)?.[1];
assert(clientId === pkg.name, `client module id (${clientId}) must equal package name (${pkg.name})`);

const requires = [...client.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
for (const request of requires) {
  assert(request === 'react', `unexpected Client require(): ${request}`);
}

for (const [key, target] of Object.entries(pkg.exports)) {
  if (target.includes('*')) continue;
  assert(exists(target), `exports.${key} points to a missing file: ${target}`);
}

for (const locale of ['en', 'zh']) {
  const file = `locale/${locale}.json`;
  const dict = JSON.parse(read(file));
  assert(typeof dict.meta?.title === 'string' && dict.meta.title.length > 0, `${file} needs meta.title`);
  assert(typeof dict.meta?.description === 'string' && dict.meta.description.length > 0, `${file} needs meta.description`);
}

const icon = read('icon.svg');
assert(icon.trimStart().startsWith('<svg'), 'icon.svg must be an SVG document');
assert(Buffer.byteLength(icon, 'utf8') <= 256 * 1024, 'icon.svg exceeds the 256 KiB bundle limit');

const host = read('index.js');
assert(host.includes("const ROUTE = '/plugin-file-search/search'"), 'Host route constant is missing');
assert(host.includes("export const inject = ['webServer']"), 'Host plugin must inject webServer');

console.log(`ok: ${pkg.name}@${pkg.version}`);
console.log(`client id: ${clientId}`);
console.log('locales: en, zh');
console.log('files: package.json, cordis.patch.yml, index.js, client.js, icon.svg, locales');

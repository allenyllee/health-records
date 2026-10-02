import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';

// A bounded heuristic guard, not a substitute for human review or a secret scanner.
// Local build/dependency folders are ignored here and must also be excluded when packaging.
const ignored = new Set(['node_modules', '.sites-runtime', '.wrangler', '.next', '.vinext', 'dist', 'coverage', 'out']);
const findings = [];
let checked = 0;
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\b(?:ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{20,}/, 'credential-like token'],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}/, 'API-key-like token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'access-key-like identifier'],
  [/\bappgprj_[a-f0-9]{24,}\b/, 'private Site project identifier'],
  [/\bplugin_asdk_app_sites_[a-f0-9]{24,}\b/, 'private Site plugin identifier'],
  [/https?:\/\/[^\s'"<>`]+\.chatgpt\.site\b/, 'deployment-specific Site hostname'],
];
async function walk(dir = '.') {
  for (const name of await readdir(dir)) {
    if (ignored.has(name)) continue;
    const file = path.join(dir, name);
    const stat = await lstat(file);
    if (stat.isSymbolicLink()) { findings.push(`${file}: symlink not permitted in source package`); continue; }
    if (name === '.git') { findings.push(`${file}: unreviewed Git history`); continue; }
    if (stat.isDirectory()) {
      if (['screenshots', 'exports', 'backups', 'uploads'].includes(name)) findings.push(`${file}: private-artifact directory`);
      await walk(file); continue;
    }
    if ((/^\.(?:env|dev\.vars)/.test(name) && !name.endsWith('.example')) || /\.(?:db|sqlite3?|tsbuildinfo|log|zip|tar\.gz)$/i.test(name)) findings.push(`${file}: runtime/private artifact`);
    if (/\.(?:jpe?g|webp|heic)$/i.test(name)) findings.push(`${file}: photo-like asset requires manual review`);
    if (/\.png$/i.test(name) && !/^public\/icon-(192|512)\.png$/.test(file)) findings.push(`${file}: unapproved PNG`);
    const bytes = await readFile(file);
    if (bytes.includes(0)) continue;
    const text = bytes.toString('utf8'); checked++;
    for (const [pattern, label] of secretPatterns) if (pattern.test(text)) findings.push(`${file}: ${label}`);
  }
}
await walk();
if (findings.length) { console.error(findings.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${checked} text files checked; no blocked identifiers/artifacts found. Review all binary assets separately.`);

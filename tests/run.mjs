import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['lib/health.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/health-model.mjs'});
await build({entryPoints:['lib/widget-bridge.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/widget-bridge.mjs'});
await build({entryPoints:['lib/widget.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/widget.mjs'});
await build({entryPoints:['lib/photo-metadata.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/photo-metadata.mjs'});
await build({entryPoints:['lib/date-evidence.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/date-evidence.mjs'});
await build({entryPoints:['lib/site-config.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/site-config.mjs'});
const r=spawnSync(process.execPath,['--test','tests/site-config.test.mjs','tests/model.test.mjs','tests/widget-bridge.test.mjs','tests/widget-chart.test.mjs','tests/photo-metadata.test.mjs'],{stdio:'inherit'});process.exit(r.status??1);

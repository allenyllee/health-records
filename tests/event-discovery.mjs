import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import assert from 'node:assert/strict';
await build({entryPoints:['tests/integration-worker.ts'],bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers'],outfile:'.sites-runtime/event-discovery-worker.mjs'});
// Deliberately no database binding: the discovery-only probe cannot write data.
const mf=new Miniflare({scriptPath:'.sites-runtime/event-discovery-worker.mjs',modules:true,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],bindings:{HEALTH_PUBLIC_ORIGIN:'https://health.example.test',HEALTH_REAL_OWNER_ID:'probe-owner',HEALTH_REAL_CONSENT_VERSION:'owner-photos-structured-v1'}});
const call=async(method,params={},owner,origin,version)=>{const r=await mf.dispatchFetch('http://localhost/mcp',{method:'POST',headers:{'Content-Type':'application/json',...(version?{'mcp-protocol-version':version}:{}),...(owner?{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':owner+'@example.test'}:{}),...(origin?{origin}:{})},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});return {status:r.status,...await r.json()};};
let n=0;const ok=(label,check)=>{check();n++;console.log('PASS',label)};
try{
let r=await call('server/discover');ok('MCP 2.0 event capability discoverable without private data',()=>{assert.deepEqual(r.result.supportedVersions,['2026-07-28']);assert.deepEqual(r.result.capabilities.events,{});assert.equal(r.result.resultType,'complete');assert.equal(r.result.cacheScope,'private');assert.equal(r.result.ttlMs,0);});
r=await call('events/list');const event=r.result.events[0];ok('one isolated synthetic event with narrow payload',()=>{assert.equal(r.result.resultType,'complete');assert.equal(r.result.events.length,1);assert.equal(event.name,'synthetic_upload.ready');assert.equal(event.inputSchema.properties.scope.const,'synthetic_probe');assert.equal(event.payloadSchema.properties.synthetic.const,true);assert.equal(event.payloadSchema.additionalProperties,false);assert.match(event.description,/disabled/);});
const args={name:event.name,arguments:{scope:'synthetic_probe'},delivery:{mode:'webhook',url:'https://example.invalid/never-called',secret:'DO_NOT_STORE_OR_ECHO'}};
r=await call('events/subscribe',args);ok('subscription requires identity',()=>assert.equal(r.status,401));
r=await call('events/subscribe',args,'other-owner');ok('different authenticated owner rejected',()=>assert.equal(r.status,403));
r=await call('events/subscribe',args,'probe-owner');ok('valid owner subscription fails closed without storage or egress',()=>{assert.equal(r.error.code,-32000);assert.equal(r.error.data.reason,'transport_not_configured');assert.ok(!JSON.stringify(r).includes('DO_NOT_STORE_OR_ECHO'));assert.ok(!JSON.stringify(r).includes('example.invalid'));});
r=await call('events/subscribe',{...args,arguments:{scope:'real'}},'probe-owner');ok('real namespace rejected',()=>assert.equal(r.error.code,-32602));
r=await call('events/subscribe',{...args,arguments:{scope:'synthetic_probe',extra:true}},'probe-owner');ok('extra filters rejected',()=>assert.equal(r.error.code,-32602));
r=await call('events/unsubscribe',args,'probe-owner');ok('unsubscribe no-op succeeds without database',()=>assert.deepEqual(r.result,{resultType:'complete'}));
r=await call('events/unsubscribe',args,'other-owner');ok('unsubscribe owner protection',()=>assert.equal(r.status,403));
r=await call('events/list',{},undefined,'https://evil.example');ok('cross-origin discovery rejected',()=>assert.equal(r.status,403));
r=await call('tools/list');ok('existing seven tools unchanged',()=>assert.equal(r.result.tools.length,7));
r=await call('initialize');ok('legacy host initialization preserved',()=>assert.equal(r.result.protocolVersion,'2025-06-18'));
r=await call('tools/list',{},undefined,undefined,'2026-07-28');ok('MCP 2.0 nonempty result discriminant',()=>{assert.equal(r.result.resultType,'complete');assert.equal(r.result.cacheScope,'private');assert.equal(r.result.ttlMs,0);});
r=await call('tools/list');ok('legacy tool result kept compatible',()=>assert.equal(r.result.resultType,undefined));
r=await call('ping',{},undefined,undefined,'2026-07-28');ok('MCP2 empty result follows base Result schema',()=>assert.deepEqual(r.result,{resultType:'complete'}));
r=await call('ping');ok('legacy ping remains empty',()=>assert.deepEqual(r.result,{}));
r=await call('resources/read',{uri:'ui://health/records-v4.html'});ok('configured widget origin and CSP agree',()=>{const resource=r.result.contents[0];assert.deepEqual(resource._meta['openai/widgetCSP'].redirect_domains,['https://health.example.test']);assert.match(resource.text,/const siteUrl="https:\/\/health\.example\.test";/);});
console.log('Discovery checks passed:',n);
}finally{await mf.dispose();}

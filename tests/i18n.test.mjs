import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Dashboard from '../.sites-runtime/dashboard-smoke.mjs';
import {i18n,i18nSource,createLocaleController,localeMessages} from '../.sites-runtime/i18n.mjs';
import {widgetHtml} from '../.sites-runtime/widget.mjs';

function fakeWindow(languages=['en-US']) {
  const listeners=new Map(),store=new Map(),writes=[];
  const w={navigator:{languages,language:languages[0]},openai:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{store.set(k,v);writes.push([k,v]);},removeItem:k=>{store.delete(k);writes.push([k,null]);}},addEventListener:(key,callback)=>{if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key).add(callback);},removeEventListener:(key,callback)=>listeners.get(key)?.delete(callback)};
  w.emit=(key,event={})=>listeners.get(key)?.forEach(callback=>callback(event));
  return {w,store,writes};
}
test('resolver maps supported BCP47 and uses browser fallbacks for unsupported/invalid host',()=>{
  for(const tag of ['zh-Hant','zh-TW','ZH-hk','zh-MO','zh-Hant-US','zh'])assert.equal(i18n.resolve('auto',tag,['en-US'],true),'zh-Hant');
  assert.equal(i18n.resolve('auto','en-GB',['zh-TW'],true),'en');
  for(const tag of ['zh-Hans','zh-CN','zh-SG','fr-FR','bad_tag',null])assert.equal(i18n.resolve('auto',tag,['fr','zh-TW','en'],true),'zh-Hant');
  assert.equal(i18n.resolve('auto','zh-Hant',['en-GB'],false),'en');
  assert.equal(i18n.resolve('auto',undefined,['fr','de'],false),'en');
  assert.equal(i18n.resolve('en','zh-Hant',['zh-TW'],true),'en');
});
test('manual override wins over host changes; Auto removes persistence and resumes live locale',()=>{
  const {w,writes,store}=fakeWindow(['en-US']);w.openai.locale='zh-TW';
  const c=createLocaleController(w,i18n,true),changes=[];c.subscribe(value=>changes.push(value));
  assert.equal(c.current(),'zh-Hant');c.setPreference('en');c.updateHostLocale('zh-HK');assert.equal(c.current(),'en');
  c.setPreference('auto');assert.equal(c.current(),'zh-Hant');assert.equal(store.size,0);
  w.emit('openai:set_globals',{detail:{globals:{locale:'en-US'}}});assert.equal(c.current(),'en');
  w.navigator.languages=['zh-TW'];c.updateHostLocale(null);assert.equal(c.current(),'zh-Hant');
  w.navigator.languages=['en'];w.emit('languagechange');assert.equal(c.current(),'en');
  assert.ok(changes.length>3);assert.ok(writes.every(([key,value])=>key==='health-records.locale'&&(value===null||['en','zh-Hant'].includes(value))));c.dispose();
});
test('unrelated globals do not clear host hint; standalone ignores host; blocked storage stays usable',()=>{
  const {w}=fakeWindow(['en']);w.openai.locale='zh-TW';const embedded=createLocaleController(w,i18n,true);
  w.emit('openai:set_globals',{detail:{globals:{toolOutput:{}}}});assert.equal(embedded.current(),'zh-Hant');embedded.dispose();
  const standalone=createLocaleController(w,i18n,false);assert.equal(standalone.current(),'en');standalone.updateHostLocale('zh-HK');assert.equal(standalone.current(),'en');standalone.dispose();
  Object.defineProperty(w,'localStorage',{get(){throw new Error('sandbox');}});
  const blocked=createLocaleController(w,i18n,true);blocked.setPreference('en');assert.equal(blocked.current(),'en');blocked.setPreference('auto');assert.equal(blocked.current(),'zh-Hant');blocked.dispose();
});
test('dictionary parity, placeholders, translated errors and original data preservation',()=>{
  // Derive dictionaries from the exact serialized runtime shipped to the widget.
  const ctx={};vm.runInNewContext(i18nSource+';globalThis.runtime=healthI18n;',ctx);
  assert.deepEqual(Object.keys(localeMessages.en).sort(),Object.keys(localeMessages['zh-Hant']).sort());
  for(const key of Object.keys(localeMessages.en)) {
    const en=localeMessages.en[key],zh=localeMessages['zh-Hant'][key];
    assert.ok(en.trim()&&zh.trim(),key);assert.deepEqual([...en.matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort(),[...zh.matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort(),key);
  }
  assert.equal(i18n.message('請確認重量單位','en'),'Confirm the weight unit');
  assert.equal(i18n.message('Confirm the weight unit','zh-Hant'),'請確認重量單位');
  assert.equal(i18n.message('weight 必須是數字','en'),'Weight must be a number');
  assert.equal(i18n.demoText('深蹲','en','demo'),'Squat');assert.equal(i18n.demoText('深蹲','en','real'),'深蹲');
  assert.equal(i18n.demoText('My original note 深蹲','en','demo'),'My original note 深蹲');
  assert.equal(i18n.date('2026-10-01','en'),'Oct 1, 2026');assert.equal(i18n.date('unknown original date','en'),'unknown original date');
  assert.equal(i18n.number(null,'en'),'—');assert.equal(i18n.number(72.4,'en',1),'72.4');
  assert.equal(ctx.runtime.resolve('auto','zh-HK',['en'],true),i18n.resolve('auto','zh-HK',['en'],true));
});

class Element {
  constructor(tag='div',attrs={}){this.tag=tag;this.attrs=attrs;this.children=[];this.style={};this.files=[];this.checked=false;this.value='';this._text='';}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  append(...values){this.children.push(...values);}
  replaceChildren(...values){this.children=values;this._text='';}
}
async function widgetHarness(hostLocale='en-US') {
  const {w,writes}=fakeWindow(['zh-TW']);const calls=[];
  const initial={namespace:'demo',realEnabled:false,records:[{id:'stable-record',kind:'body',date:'2026-10-01',weight:72.4,unit:'kg'}],drafts:[{id:'stable-draft',kind:'strength',date:null,exercise:'深蹲',load:60,unit:'kg',reps:8,sets:3,timezone:'Asia/Taipei',uncertain:[],notes:'合成示範資料',issues:['請確認實際紀錄日期']}]};
  const original=JSON.stringify(initial);w.openai={locale:hostLocale,toolOutput:initial};
  const ids=Object.fromEntries([...widgetHtml.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const nodes=[...widgetHtml.matchAll(/data-i18n="([^"]+)"/g)].map(m=>new Element('span',{'data-i18n':m[1]}));
  const aria=[...widgetHtml.matchAll(/data-i18n-aria="([^"]+)"/g)].map(m=>new Element('input',{'data-i18n-aria':m[1]}));
  const document={documentElement:{lang:'en'},title:'',getElementById:id=>ids[id],querySelectorAll:selector=>selector==='[data-i18n]'?nodes:aria,createElementNS:(_,tag)=>new Element(tag),createElement:tag=>new Element(tag)};
  w.document=document;w.setTimeout=setTimeout;w.clearTimeout=clearTimeout;
  w.parent={postMessage(message){calls.push(message);if(message.method==='ui/initialize')queueMicrotask(()=>w.emit('message',{source:w.parent,origin:'https://chatgpt.com',data:{jsonrpc:'2.0',id:message.id,result:{hostCapabilities:{message:{text:{},image:{}},serverTools:{}},hostContext:{locale:hostLocale}}}}));}};
  const script=widgetHtml.slice(widgetHtml.indexOf('<script>')+8,widgetHtml.lastIndexOf('</script>'));
  vm.runInNewContext(script,{window:w,document,Intl,Date,Map,Set,Promise,setTimeout,clearTimeout,Uint8Array,TextDecoder,URL,console});
  await new Promise(resolve=>setImmediate(resolve));
  return {w,ids,nodes,document,calls,writes,initial,original,change(value){ids.locale.value=value;ids.locale.onchange();},host(value){w.emit('message',{source:w.parent,origin:'https://chatgpt.com',data:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{locale:value}}});},close(){w.emit('message',{source:w.parent,origin:'https://chatgpt.com',data:{jsonrpc:'2.0',id:'teardown',method:'ui/resource-teardown'}});}};
}
test('embedded UI updates all static/dynamic labels, chart, demo and current status without rewriting data',async()=>{
  const h=await widgetHarness();try {
    assert.equal(h.document.documentElement.lang,'en');assert.equal(h.ids.analyze.textContent,'Analyze synthetic image');
    assert.ok(h.ids.drafts.textContent.includes('Squat'));assert.ok(h.ids.drafts.textContent.includes('Synthetic demo data'));assert.ok(h.ids.drafts.textContent.includes('Confirm the actual measurement date'));
    const chart=()=>h.ids.chart.children[0];assert.equal(chart().attrs['aria-label'],'Synthetic weight trend, 1 records');
    assert.ok(chart().textContent.includes('Oct 1, 2026'));
    await h.ids.analyze.onclick();assert.equal(h.ids.status.textContent,'Select an image first');
    const before=h.calls.length;h.change('zh-Hant');assert.equal(h.document.documentElement.lang,'zh-Hant');assert.equal(h.ids.status.textContent,'請先選擇一張圖片');assert.ok(h.ids.drafts.textContent.includes('深蹲'));
    h.host('en-US');assert.equal(h.document.documentElement.lang,'zh-Hant');h.change('auto');assert.equal(h.document.documentElement.lang,'en');assert.equal(h.ids.status.textContent,'Select an image first');
    h.host('zh-HK');assert.equal(h.document.documentElement.lang,'zh-Hant');assert.equal(h.ids.analyze.textContent,'分析合成圖片');
    h.w.emit('openai:set_globals',{detail:{globals:{locale:'en'}}});assert.equal(h.document.documentElement.lang,'en');
    assert.equal(h.calls.length,before);assert.equal(JSON.stringify(h.initial),h.original);assert.ok(h.writes.every(([key])=>key==='health-records.locale'));
    assert.ok(h.nodes.some(el=>el.attrs['data-i18n']==='讓 ChatGPT 整理照片'&&el.textContent==='Ask ChatGPT to organize a photo'));
  }finally{h.close();}
});
test('host locale notifications respect pinned origin and ignore unrelated context fields',async()=>{
  const h=await widgetHarness('zh-TW');try {
    h.w.emit('message',{source:{},origin:'https://chatgpt.com',data:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{locale:'en'}}});assert.equal(h.document.documentElement.lang,'zh-Hant');
    h.w.emit('message',{source:h.w.parent,origin:'https://wrong.invalid',data:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{locale:'en'}}});assert.equal(h.document.documentElement.lang,'zh-Hant');
    h.w.emit('message',{source:h.w.parent,origin:'https://chatgpt.com',data:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{theme:'dark'}}});assert.equal(h.document.documentElement.lang,'zh-Hant');
    h.host(null);assert.equal(h.document.documentElement.lang,'zh-Hant');h.w.navigator.languages=['en'];h.w.emit('languagechange');assert.equal(h.document.documentElement.lang,'en');
  }finally{h.close();}
});
test('standalone React presenter renders English and Traditional Chinese loading/chart/upload guidance',()=>{
  globalThis.__healthLocale='en';const en=renderToStaticMarkup(createElement(Dashboard));
  globalThis.__healthLocale='zh-Hant';const zh=renderToStaticMarkup(createElement(Dashboard));delete globalThis.__healthLocale;
  for(const label of ['Loading private records','Body and training','Save records to see a trend','Upload photos, analyze with your own key'])assert.ok(en.includes(label),label);
  for(const label of ['正在讀取私人紀錄','身體與訓練','儲存紀錄後','上傳照片，使用自己的 key 分析'])assert.ok(zh.includes(label),label);
  assert.equal(en.includes('Add record'),false);assert.equal(zh.includes('新增紀錄'),false);assert.equal(en.includes('capture-panel'),false);
  assert.equal(en.includes('正在讀取私人紀錄'),false);assert.equal(zh.includes('Loading private records'),false);
  assert.ok(en.includes('value="auto"'));assert.ok(en.includes('value="real"'));assert.ok(zh.includes('value="demo"'));
});
test('offline PWA shell follows shared preference controller without any health cache',async()=>{
  const source=await readFile('public/offline.html','utf8');assert.ok(source.includes('health-records.locale'));assert.equal(source.includes('fetch('),false);
  const serviceWorker=await readFile('public/sw.js','utf8');assert.ok(serviceWorker.includes("['/offline.html','/favicon.svg']"));assert.equal(serviceWorker.includes('/api/health'),false);
});
test('all declared frontend text and accessibility keys have both translations',async()=>{
  for(const file of ['app/dashboard.tsx','lib/widget.ts']) {
    const source=await readFile(file,'utf8');
    const keys=[...source.matchAll(/\bt\('([^']+)'/g),...source.matchAll(/data-i18n="([^"]+)"/g),...source.matchAll(/data-i18n-aria="([^"]+)"/g)].map(match=>match[1]);
    for(const key of keys)for(const locale of i18n.supported)assert.equal(typeof localeMessages[locale][key],'string',file+': '+locale+' '+key);
  }
});

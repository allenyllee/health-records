import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {writeFile} from 'node:fs/promises';
import {i18n} from '../.sites-runtime/i18n.mjs';
import {widgetHtml,WIDGET_URI} from '../.sites-runtime/widget.mjs';
class Element {
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';this.style={};}
  setAttribute(name,value){this.attrs[name]=String(value);}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function xml(el){return '<'+el.tag+Object.entries(el.attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+escape(el.textContent)+el.children.map(xml).join('')+'</'+el.tag+'>';}
function render(records){
  const els=Object.fromEntries(['count','weight','chart','drafts','space','banner','demo-consent','analyze'].map(id=>[id,new Element('div')]));
  const document={createElementNS:(_,tag)=>new Element(tag),createElement:tag=>new Element(tag)};
  const source=widgetHtml.slice(widgetHtml.indexOf('function render(data)'),widgetHtml.indexOf('async function refresh()'));
  vm.runInNewContext("let currentNamespace='demo';let realAllowed=false;let lastData=null;let batchPanel=null;"+source+';render(data)',{document,$:id=>els[id],healthI18n:i18n,locale:'zh-Hant',t:(key,params)=>i18n.t(key,'zh-Hant',params),n:(value,digits)=>i18n.number(value,'zh-Hant',digits),d:(value,short)=>i18n.date(value,'zh-Hant',short),msg:value=>i18n.message(value,'zh-Hant'),data:{records,drafts:[]}});
  return els;
}
const body=(date,weight)=>({kind:'body',date,weight,unit:'kg'});
test('empty embedded chart has no stale markers and truthful stats',()=>{
  const els=render([]);assert.equal(els.chart.children.length,0);assert.equal(els.count.textContent,'0');assert.equal(els.weight.textContent,'—');
});
test('one embedded record has a visible centered point and accessible value',async()=>{
  assert.equal(WIDGET_URI,'ui://health/records-v5.html');
  const els=render([body('2026-10-01',72.4)]),svg=els.chart.children[0];
  const circles=svg.children.filter(e=>e.tag==='circle');assert.equal(circles.length,1);
  assert.equal(circles[0].attrs.cx,'300');assert.equal(circles[0].attrs.cy,'82.5');assert.equal(circles[0].attrs.r,'4');
  assert.equal(circles[0].attrs['aria-label'],i18n.date('2026-10-01','zh-Hant')+' · 72.4 kg');
  assert.equal(circles[0].children[0].textContent,i18n.date('2026-10-01','zh-Hant')+' · 72.4 kg');
  assert.equal(svg.attrs['aria-label'],'合成體重趨勢，1 筆紀錄');assert.equal(svg.children[0].textContent,i18n.date('2026-10-01','zh-Hant')+' · 72.4 kg');
  assert.equal(els.weight.textContent,'72.4 kg');svg.attrs.xmlns='http://www.w3.org/2000/svg';
  await writeFile('.sites-runtime/chart-one.svg',xml(svg));
});
test('two embedded records keep chronological markers and connecting path',async()=>{
  const els=render([body('2026-10-02',72.1),body('2026-10-01',72.4)]),svg=els.chart.children[0];
  const circles=svg.children.filter(e=>e.tag==='circle');assert.equal(circles.length,2);
  assert.deepEqual(circles.map(e=>e.attrs.cx),['35','565']);
  assert.deepEqual(circles.map(e=>e.attrs['aria-label']),[i18n.date('2026-10-01','zh-Hant')+' · 72.4 kg',i18n.date('2026-10-02','zh-Hant')+' · 72.1 kg']);
  assert.ok(circles.every(e=>Number.isFinite(Number(e.attrs.cy))));
  assert.match(svg.children.find(e=>e.tag==='path').attrs.d,/^M35,[\d.]+ L565,[\d.]+$/);
  assert.equal(els.count.textContent,'2');assert.equal(els.weight.textContent,'72.1 kg');
  svg.attrs.xmlns='http://www.w3.org/2000/svg';await writeFile('.sites-runtime/chart-two.svg',xml(svg));
});

import {localeMessages} from './locale-messages';
export {localeMessages};
export type Locale = keyof typeof localeMessages;
export type LocalePreference = Locale | 'auto';

/** Kept self-contained so the exact same resolver/formatters run in the iframe. */
export function createLocaleRuntime(messages:Record<string,Record<string,string>>) {
  const supported=Object.keys(messages), fallback='en';
  function match(value:unknown):string|null {
    if(typeof value!=='string'||!value.trim())return null;
    try {
      const candidate=new Intl.Locale(value.trim());
      const exact=supported.find(code=>code.toLowerCase()===candidate.baseName.toLowerCase());
      if(exact)return exact;
      if(candidate.language==='zh'&&supported.includes('zh-Hant')) {
        if(candidate.script==='Hans'||(['CN','SG'].includes(candidate.region||'')&&candidate.script!=='Hant'))return null;
        return 'zh-Hant';
      }
      return supported.find(code=>new Intl.Locale(code).language===candidate.language)||null;
    } catch {return null;}
  }
  function resolve(preference:unknown,hostLocale:unknown,browserLocales:readonly unknown[]=[],embedded=false):string {
    if(typeof preference==='string'&&supported.includes(preference))return preference;
    if(embedded){const host=match(hostLocale);if(host)return host;}
    for(const value of browserLocales){const browser=match(value);if(browser)return browser;}
    return fallback;
  }
  function t(key:string,locale:string='en',params:Record<string,unknown>={}):string {
    const text=messages[locale]?.[key]??messages[fallback]?.[key]??key;
    return text.replace(/\{([a-zA-Z]+)\}/g,(_,name:string)=>String(params[name]??'{'+name+'}'));
  }
  function number(value:number|null|undefined,locale:string,digits?:number):string {
    if(value===null||value===undefined||!Number.isFinite(value))return '—';
    return new Intl.NumberFormat(locale,digits===undefined?{}:{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  }
  function date(value:string|null|undefined,locale:string,short=false):string {
    if(!value)return t('日期待確認',locale);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
    const stamp=new Date(value+'T12:00:00Z');
    if(!Number.isFinite(stamp.getTime())||stamp.toISOString().slice(0,10)!==value)return value;
    return new Intl.DateTimeFormat(locale,{timeZone:'UTC',...(short?{}:{year:'numeric' as const}),month:'short',day:'numeric'}).format(stamp);
  }
  function message(value:string,locale:string):string {
    if(messages[fallback]?.[value]!==undefined)return t(value,locale);
    const englishKey=Object.keys(messages[fallback]||{}).find(key=>messages[fallback][key]===value);
    if(englishKey)return t(englishKey,locale);
    const uncertain='請核對並清除不確定欄位：';
    if(value.startsWith(uncertain))return t(uncertain,locale)+value.slice(uncertain.length);
    const numeric=value.match(/^(weight|bodyfat|load|reps|sets) 必須是數字$/);
    if(numeric)return t('field.number',locale,{field:t('field.'+numeric[1],locale)});
    // Only known system issue messages are split; user-entered text is never sent here.
    if(value.includes('；'))return value.split('；').map(part=>message(part,locale)).join(locale==='en'?'; ':'；');
    return value;
  }
  function demoText(value:string|null|undefined,locale:string,namespace:string):string {
    // Exact known synthetic seed strings only; real/user-edited text remains verbatim.
    return namespace==='demo'&&(value==='合成示範資料'||value==='深蹲')?t(value,locale):value||'';
  }
  return {supported,match,resolve,t,number,date,message,demoText};
}
export const i18n=createLocaleRuntime(localeMessages);

/** Persist ONLY a supported manual language; Auto is removal, not a saved profile. */
export function createLocaleController(w:Window, runtime:ReturnType<typeof createLocaleRuntime>, embedded=false) {
  const storageKey='health-records.locale';
  let preference='auto',hostLocale:unknown=undefined;
  const listeners=new Set<(locale:string)=>void>();
  const read=()=>{try {const stored=w.localStorage.getItem(storageKey);return stored&&runtime.supported.includes(stored)?stored:'auto';}catch{return 'auto';}};
  preference=read();
  if(embedded)hostLocale=(w as Window & {openai?:{locale?:unknown}}).openai?.locale;
  const browser=()=>w.navigator.languages?.length?w.navigator.languages:[w.navigator.language];
  const current=()=>runtime.resolve(preference,hostLocale,browser(),embedded);
  const emit=()=>listeners.forEach(callback=>callback(current()));
  const setPreference=(value:string)=>{
    preference=runtime.supported.includes(value)?value:'auto';
    try {if(preference==='auto')w.localStorage.removeItem(storageKey);else w.localStorage.setItem(storageKey,preference);}catch{/* Sandboxed storage may be unavailable; manual override still works for this view. */}
    emit();
  };
  const updateHostLocale=(value:unknown)=>{if(!embedded)return;hostLocale=value;emit();};
  const globals=(event:Event)=>{const fields=(event as CustomEvent).detail?.globals;if(fields&&Object.prototype.hasOwnProperty.call(fields,'locale'))updateHostLocale(fields.locale);};
  const language=()=>emit();
  const storage=(event:StorageEvent)=>{if(event.key===storageKey||event.key===null){preference=read();emit();}};
  w.addEventListener('languagechange',language);w.addEventListener('storage',storage);
  if(embedded)w.addEventListener('openai:set_globals',globals);
  return {current,getPreference:()=>preference,setPreference,updateHostLocale,
    subscribe:(callback:(locale:string)=>void)=>{listeners.add(callback);return ()=>{listeners.delete(callback);};},
    dispose:()=>{w.removeEventListener('languagechange',language);w.removeEventListener('storage',storage);w.removeEventListener('openai:set_globals',globals);listeners.clear();}};
}
// Serialization strips '<' to prevent data from closing the script element.
export const i18nSource=`const healthI18n=(${createLocaleRuntime.toString()})(${JSON.stringify(localeMessages).replace(/</g,'\\u003c')});\nconst createHealthLocaleController=${createLocaleController.toString()};\n`;

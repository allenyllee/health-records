'use client';
import {useEffect,useRef,useState} from 'react';
import {createLocaleController,i18n,type Locale,type LocalePreference} from './i18n';

export function useLocale() {
  const [locale,setLocale]=useState<Locale>('en');
  const [preference,setPreferenceState]=useState<LocalePreference>('auto');
  const controller=useRef<ReturnType<typeof createLocaleController>|null>(null);
  useEffect(()=>{
    const next=createLocaleController(window,i18n,false);controller.current=next;
    const update=(value:string)=>{setLocale(value as Locale);setPreferenceState(next.getPreference() as LocalePreference);};
    update(next.current());const unsubscribe=next.subscribe(update);
    return ()=>{unsubscribe();next.dispose();controller.current=null;};
  },[]);
  useEffect(()=>{document.documentElement.lang=locale;document.title=i18n.t('page.title',locale);},[locale]);
  return {locale,preference,setPreference:(value:LocalePreference)=>controller.current?.setPreference(value)};
}

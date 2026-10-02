import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'健康紀錄 · 私人測試版',description:'本人私人健康與訓練紀錄，日期不明時等待核對',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icon-192.png'},appleWebApp:{capable:true,title:'健康紀錄',statusBarStyle:'default'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-Hant"><body>{children}</body></html>;}

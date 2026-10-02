import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Health records · 健康紀錄',description:'Private body and training records · 本人健康與訓練紀錄',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icon-192.png'},appleWebApp:{capable:true,title:'Health records',statusBarStyle:'default'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}

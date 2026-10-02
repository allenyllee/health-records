import {mcpResponse} from '@/lib/mcp';
export const dynamic='force-dynamic';
export const POST=mcpResponse;
export async function GET(){return new Response('Use stateless HTTP POST',{status:405,headers:{Allow:'POST'}});}

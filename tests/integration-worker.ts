import {GET,POST} from '../app/api/health/route';
import {mcpResponse} from '../lib/mcp';
const worker={fetch(request:Request){return new URL(request.url).pathname==='/mcp'?mcpResponse(request):request.method==='GET'?GET(request):POST(request);}};

export default worker;

import handler from 'vinext/server/fetch-handler';

// Authentication is supplied by the private hosting gateway. This worker does
// not verify arbitrary client-provided identity headers. See SECURITY.md.
export default handler;

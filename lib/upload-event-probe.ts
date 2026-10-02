import {AppError,requireOwner} from './health';
import {realEnabled} from './store';

// Capability discovery only. No uploads, secrets, subscriptions or callbacks are
// stored, and this module never makes an outbound request. Keep the production
// capture flow unchanged until an approved end-to-end synthetic test succeeds.
export const uploadProbeEvent={
  name:'synthetic_upload.ready',
  description:'Discovery-only synthetic upload test. Subscription and delivery are currently disabled; this event does not analyze photos or create health records.',
  delivery:['webhook'],
  inputSchema:{type:'object',properties:{scope:{const:'synthetic_probe',description:'Isolated synthetic capability test only. Real records and the demo namespace are excluded.'}},required:['scope'],additionalProperties:false},
  payloadSchema:{type:'object',properties:{uploadId:{type:'string'},synthetic:{const:true}},required:['uploadId','synthetic'],additionalProperties:false}
};

export function probeOwner(headers:Headers){
  const owner=requireOwner(headers);
  if(!realEnabled(owner))throw new AppError(403,'Only the authorized Site owner can manage this synthetic probe');
  return owner;
}

export function validProbeParameters(params:unknown){
  if(!params||typeof params!=='object')return false;
  const p=params as Record<string,unknown>;
  const a=p.arguments;
  return p.name===uploadProbeEvent.name&&!!a&&typeof a==='object'&&!Array.isArray(a)
    &&Object.keys(a).length===1&&(a as Record<string,unknown>).scope==='synthetic_probe';
}

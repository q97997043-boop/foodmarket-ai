import handler from '../api/debug-db';

function makeRes(){
  let status=200;
  return {
    setHeader: (_:string, __:string)=>{},
    status(code:number){ status=code; return this; },
    json(payload:any){ console.log('DEBUG-DB RESP', status, JSON.stringify(payload)); return payload; }
  } as any;
}

async function main(){
  await handler({} as any, makeRes());
}

main().catch(e=>{ console.error(e); process.exit(1); });

import registerHandler from '../api/auth/register';
import loginHandler from '../api/auth/login';

function makeRes() {
  let statusCode = 200;
  return {
    setHeader: (_: string, __: string) => {},
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      console.log('RESP', statusCode, JSON.stringify(payload));
      return payload;
    },
    end() {
      console.log('END', statusCode);
    },
  };
}

async function test() {
  const email = `apirun+${Date.now()}@example.com`;
  const password = 'Pass123!';

  console.log('API REGISTER TEST', { email });
  await registerHandler(
    { method: 'POST', body: { email, password } } as any,
    makeRes() as any,
  );

  console.log('API LOGIN TEST', { email });
  await loginHandler(
    { method: 'POST', body: { email, password } } as any,
    makeRes() as any,
  );
}

test().catch((e) => { console.error('API TEST ERROR', e); process.exit(1); });

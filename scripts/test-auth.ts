import { registerUser, loginUser } from '../api/lib/auth-service';

async function main() {
  try {
    const email = `autotest+${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('TEST REGISTER', { email });
    const reg = await registerUser({ email, password, restaurantName: 'AutoTest Cafe' });
    console.log('REGISTER RESULT', reg);

    console.log('TEST LOGIN', { email });
    const login = await loginUser({ email, password });
    console.log('LOGIN RESULT', login);
  } catch (err) {
    console.error('TEST-AUTH ERROR', err);
    process.exit(1);
  }
}

main();

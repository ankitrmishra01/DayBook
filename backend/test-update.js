const email = 'ankitrmishra01@gmail.com';
const password = 'ankit1234';

async function test() {
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login:', loginRes.status, await loginRes.json());
  
  const patchRes = await fetch('http://127.0.0.1:3000/api/user/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ themePreference: 'light' })
  });
  
  console.log('Patch:', patchRes.status, await patchRes.json());
}

test();

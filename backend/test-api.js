async function run() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ankitrmishra01@gmail.com' })
    });
    
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('RESPONSE:', text);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();

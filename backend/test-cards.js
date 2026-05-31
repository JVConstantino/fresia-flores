const http = require('http');

async function makeRequest(method, path, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (cookie) options.headers.Cookie = cookie;

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({ data: responseData, cookie: setCookie ? setCookie[0].split(';')[0] : null });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    // Login as test user 3
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'test3@example.com',
      password: '123456'
    });
    const cookie = loginRes.cookie;
    console.log('✓ Logged in');

    // Get cards (should be empty)
    const cardsRes = await makeRequest('GET', '/account/cards', null, cookie);
    console.log('✓ Get cards (empty):', cardsRes.data);

    // Create card
    const createCardRes = await makeRequest('POST', '/account/cards', {
      brand: 'visa',
      lastFour: '1234',
      nickname: 'Meu Cartão Visa',
      isDefault: true
    }, cookie);
    console.log('✓ Create card:', createCardRes.data);

    // Create second card
    const createCard2Res = await makeRequest('POST', '/account/cards', {
      brand: 'mastercard',
      lastFour: '5678',
      nickname: 'Mastercard',
      isDefault: false
    }, cookie);
    console.log('✓ Create card 2:', createCard2Res.data);

    // Get cards again
    const cardsRes2 = await makeRequest('GET', '/account/cards', null, cookie);
    console.log('✓ Get cards (list):', cardsRes2.data);

    // Test password update
    const updatePwdRes = await makeRequest('PATCH', '/account/password', {
      currentPassword: '123456',
      newPassword: '654321'
    }, cookie);
    console.log('✓ Update password:', updatePwdRes.data);

    // Try old password (should fail)
    const oldLoginRes = await makeRequest('POST', '/auth/login', {
      email: 'test3@example.com',
      password: '123456'
    });
    console.log('✓ Old password login (should fail):', oldLoginRes.data);

    // Login with new password
    const newLoginRes = await makeRequest('POST', '/auth/login', {
      email: 'test3@example.com',
      password: '654321'
    });
    console.log('✓ New password login:', newLoginRes.data.email);

  } catch (err) {
    console.error('✗ Error:', err.message);
  }
  process.exit(0);
})();

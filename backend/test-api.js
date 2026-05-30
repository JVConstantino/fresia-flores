const http = require('http');
const querystring = require('querystring');

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
        resolve({ data: responseData, cookie: setCookie ? setCookie[0].split(';')[0] : null, status: res.statusCode });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    // Register
    const registerRes = await makeRequest('POST', '/auth/register', {
      name: 'Test User 3',
      email: 'test3@example.com',
      password: '123456',
      phone: '11987654321'
    });
    console.log('Register:', registerRes.data);

    // Login
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'test3@example.com',
      password: '123456'
    });
    console.log('Login:', loginRes.data);
    console.log('Cookie:', loginRes.cookie);

    // Get addresses
    const addressesRes = await makeRequest('GET', '/account/addresses', null, loginRes.cookie);
    console.log('Addresses:', addressesRes.data);

    // Create address
    const createAddrRes = await makeRequest('POST', '/account/addresses', {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
      isDefault: true
    }, loginRes.cookie);
    console.log('Create Address:', createAddrRes.data);

    // Get addresses again
    const addressesRes2 = await makeRequest('GET', '/account/addresses', null, loginRes.cookie);
    console.log('Addresses after create:', addressesRes2.data);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();

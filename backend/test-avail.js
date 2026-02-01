import axios from 'axios';

async function testTargeted() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('Fetching products...');
    const prodRes = await axios.get(`${baseURL}/products?search=stand`);
    const product = prodRes.data.products[0];
    
    if (!product) {
      console.log('No "stand" product found');
      return;
    }
    console.log(`Testing Product: ${product.name} (ID: ${product.id})`);
    
    // Testing dates active in reservation (Feb 6 - Feb 11, 2026)
    // Overlap: Feb 8 - Feb 10
    const start = '2026-02-08T09:00:00.000Z';
    const end = '2026-02-10T18:00:00.000Z';
    
    console.log(`Checking availability for ${start} to ${end}...`);
    const res = await axios.get(`${baseURL}/products/${product.id}/availability?startDate=${start}&endDate=${end}`);
    console.log('Result:', res.data);
    
  } catch (err) {
    console.error('Error:', err.message);
    if(err.response) console.log(err.response.data);
  }
}

testTargeted();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testRoutes() {
  try {
    console.log('Testing filters route...');
    const filtersResponse = await axios.get(`${BASE_URL}/names/islamic/filters`);
    fs.writeFileSync(path.join(__dirname, 'filters_results.json'), JSON.stringify(filtersResponse.data, null, 2));
    console.log('Filters results saved to filters_results.json');

    console.log('Testing names route with filters...');
    const namesResponse = await axios.get(`${BASE_URL}/names`, {
      params: {
        religion: 'islamic',
        gender: 'male',
        limit: 10
      }
    });
    fs.writeFileSync(path.join(__dirname, 'names_results.json'), JSON.stringify(namesResponse.data, null, 2));
    console.log('Names results saved to names_results.json');

    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error during testing:', error.response ? error.response.data : error.message);
  }
}

testRoutes();
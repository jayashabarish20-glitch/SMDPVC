const http = require('http');

// First, check if frontend is running
const checkServer = (host, port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/higher-secondary`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
    req.setTimeout(2000);
  });
};

checkServer('localhost', 5173).then(running => {
  if (running) {
    console.log('✓ Frontend server is running on http://localhost:5173');
    console.log('\nTo test the School Toppers accordion:');
    console.log('1. Open http://localhost:5173/higher-secondary in a browser');
    console.log('2. Scroll to "Celebrating Excellence" section');
    console.log('3. Click the "School Toppers" button to expand/collapse');
    console.log('4. Verify Class XII and Class X topper cards appear/disappear');
    console.log('5. Check that the existing "lkjh" record shows as Rank 1');
  } else {
    console.log('✗ Frontend server is not responding');
  }
});

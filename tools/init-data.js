const { initializeData } = require('../src/data');

initializeData().then(() => {
  console.log('data initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
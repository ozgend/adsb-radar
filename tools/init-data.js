const { populateData } = require('../src/data');

populateData().then(() => {
  console.log('data populated successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
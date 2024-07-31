const { initializeData } = require('../src/data');

const willRefresh = process.argv[2] === 'refresh';

initializeData(willRefresh).then(() => {
  console.log('data initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
const { rebuildDB } = require('../db/seedData');

const setup = async () => {
  console.log("--- JEST SETUP ---");
  await rebuildDB();
}

module.exports = setup;
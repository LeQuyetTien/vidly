const bcrypt = require('bcrypt');

async function run() {
  const salt = await bcrypt.genSalt(10);
  console.log(salt);
  
  const hashed = await bcrypt.hash('12345', salt);
  console.log(hashed);

  const check = await bcrypt.compare('1235', hashed);
  console.log(check);
}

run();

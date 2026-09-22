require('dotenv').config();
module.exports = {
  development: { dialect: 'sqlite', storage: process.env.DATABASE_PATH || './database/payment.sqlite' },
  test: { dialect: 'sqlite', storage: process.env.DATABASE_PATH || './database/payment.sqlite' },
  production: { dialect: 'sqlite', storage: process.env.DATABASE_PATH || './database/payment.sqlite' },
};

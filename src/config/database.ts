import { Sequelize } from 'sequelize';
import 'dotenv/config';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH ?? './database/payment.sqlite',
  logging: false,
});

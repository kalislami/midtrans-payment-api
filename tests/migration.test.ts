import { Sequelize, DataTypes } from 'sequelize';

const migration = require('../migrations/20260922000000-create-invoices');

test('initial migration creates a unique invoice order ID and preserves an existing table', async () => {
  const db = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const queryInterface = db.getQueryInterface();
  try {
    await migration.up(queryInterface, DataTypes);
    const columns = await queryInterface.describeTable('Invoices');
    expect(columns.orderId.allowNull).toBe(false);
    expect(columns.grossAmount.allowNull).toBe(false);
    await migration.up(queryInterface, DataTypes);
    const indexes = await queryInterface.showIndex('Invoices') as Array<{ unique: boolean; fields: Array<{ attribute: string }> }>;
    expect(indexes.some(index => index.unique && index.fields.some(field => field.attribute === 'orderId'))).toBe(true);
  } finally {
    await db.close();
  }
});

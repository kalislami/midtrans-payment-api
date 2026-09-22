'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.some(table => (typeof table === 'string' ? table : table.tableName) === 'Invoices')) {
      const indexes = await queryInterface.showIndex('Invoices');
      if (!indexes.some(index => index.unique && index.fields.some(field => field.attribute === 'orderId'))) {
        await queryInterface.addIndex('Invoices', ['orderId'], { unique: true, name: 'invoices_order_id_unique' });
      }
      return;
    }
    await queryInterface.createTable('Invoices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      orderId: { type: Sequelize.STRING, allowNull: false, unique: true },
      grossAmount: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down() {
    throw new Error('Manual rollback required: this migration may have adopted a preexisting Invoices table');
  },
};

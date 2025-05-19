import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Invoice extends Model {
  public id!: number;
  public orderId!: string;
  public grossAmount!: number;
  public status!: string;
}

Invoice.init({
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  grossAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
}, {
  sequelize,
  modelName: 'Invoice',
});
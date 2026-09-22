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
    unique: true,
  },
  grossAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  sequelize,
  modelName: 'Invoice',
});

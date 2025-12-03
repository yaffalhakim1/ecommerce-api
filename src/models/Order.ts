import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

type OrderAttributes = {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed';
  midtransPaymentId?: string;
  orderItems: string;
  paymentType?: string;
  transactionTime?: Date;
  settlementTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

interface OrderCreationAttributes
  extends Optional<OrderAttributes, 'id' | 'status' | 'midtransPaymentId'> {}

class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public userId!: number;
  public totalAmount!: number;
  public status!: 'pending' | 'completed' | 'failed';
  public midtransPaymentId?: string;
  public orderItems!: string;
  public paymentType?: string;
  public transactionTime?: Date;
  public settlementTime?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    midtransPaymentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    orderItems: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_type',
    },
    transactionTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'transaction_time',
    },
    settlementTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'settlement_time',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['midtransPaymentId'],
      },
      {
        fields: ['userId', 'createdAt'], // Composite for user order history
      },
    ],
  }
);

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

export default Order;

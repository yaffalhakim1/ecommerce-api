import { DataTypes, Model, Optional } from 'sequelize';
import Cart from './Cart';
import Product from './Product';
import { sequelize } from '../config/database';

type CartItemAttributes = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
};

interface CartItemCreationAttributes
  extends Optional<CartItemAttributes, 'id'> {}

class CartItem
  extends Model<CartItemAttributes, CartItemCreationAttributes>
  implements CartItemAttributes
{
  public id!: number;
  public cartId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cart,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
      {
        fields: ['cartId'],
      },
      {
        fields: ['productId'],
      },
      {
        fields: ['cartId', 'productId'], // Composite index
      },
    ],
  }
);

CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
export default CartItem;

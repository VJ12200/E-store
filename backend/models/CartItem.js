import { DataTypes } from 'sequelize';

const CartItem = (sequelize) => {
    const CartItemModel = sequelize.define('CartItem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id', // Added field mapping
            references: {
                model: 'users', // Fixed: lowercase table name
                key: 'id',
            },
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'product_id', // Added field mapping
            references: {
                model: 'products', // Fixed: lowercase table name
                key: 'id',
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        }
        // Removed explicit createdAt and updatedAt - Sequelize handles these automatically when timestamps: true
    }, {
        tableName: 'cart_items',
        timestamps: true
        // Removed problematic index - add manually to database if needed
    });
    
    return CartItemModel;
};

export default CartItem;
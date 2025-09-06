import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('processing', 'in_transit', 'out_for_delivery', 'delivered'),
            defaultValue: 'processing',
            allowNull: false
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        shippingCost: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false,
            field: 'shipping_cost'
        },
        tax: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        // Shipping information
        shippingFirstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'shipping_first_name'
        },
        shippingLastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'shipping_last_name'
        },
        shippingAddress: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'shipping_address'
        },
        shippingCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'shipping_city'
        },
        shippingState: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'shipping_state'
        },
        shippingZipCode: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: 'shipping_zip_code'
        },
        shippingCountry: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'shipping_country'
        },
        // Billing information
        billingFirstName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'billing_first_name'
        },
        billingLastName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'billing_last_name'
        },
        billingAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'billing_address'
        },
        billingCity: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'billing_city'
        },
        billingState: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'billing_state'
        },
        billingZipCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'billing_zip_code'
        },
        billingCountry: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'billing_country'
        },
        // Payment information
        paymentCardNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: 'payment_card_number'
        },
        paymentCardExpiry: {
            type: DataTypes.STRING(10),
            allowNull: false,
            field: 'payment_card_expiry'
        },
        paymentCardCvv: {
            type: DataTypes.STRING(10),
            allowNull: false,
            field: 'payment_card_cvv'
        },
        paymentCardName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'payment_card_name'
        }
    }, {
        tableName: 'orders',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Order;
};
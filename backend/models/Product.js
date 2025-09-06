import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
                notEmpty: true
            }
        },
        ratings: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0.00,
            validate: {
                min: 0,
                max: 5
            }
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        numofReviews: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        reviews: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'products',
        timestamps: true
    });

    return Product;
};
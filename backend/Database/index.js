import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import UserModel from '../models/User.js';
import ProductModel from '../models/Product.js';
import OrderModel from '../models/Order.js';
import CartItemModel from '../models/CartItem.js';
import ReviewModel from '../models/Review.js';
import 'colors';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            underscored: true,
            freezeTableName: true,
        },
        pool: {
            max: 10,
            min: 0,
            idle: 10000,
        },
    }
);

const User = UserModel(sequelize);
const Product = ProductModel(sequelize);
const Order = OrderModel(sequelize);
const CartItem = CartItemModel(sequelize);
const Review = ReviewModel(sequelize);

User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Review, { foreignKey: 'userId', as: 'userReviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'productReviews' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export const ensureDatabaseExists = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    } finally {
        await connection.end();
    }
};

export const initializeDatabase = async () => {
    if (!process.env.DB_NAME) {
        console.error(process.env.DB_PORT);
        throw new Error('DB_NAME is not set. Please set DB_NAME in your .env'.red.bold);
    }
    await ensureDatabaseExists();
    console.log(`Ensured database \`${process.env.DB_NAME}\` exists`.green);
    await sequelize.authenticate();
    console.log('Sequelize authenticated'.green);
    const alterSync = String(process.env.DB_SYNC_ALTER).toLowerCase() === 'true';
    const forceSync = String(process.env.DB_SYNC_FORCE).toLowerCase() === 'true';
    if (alterSync && forceSync) {
        console.warn('Both DB_SYNC_ALTER and DB_SYNC_FORCE are true; proceeding with FORCE and ignoring ALTER'.yellow.bold);
    }
    await sequelize.sync({ alter: alterSync && !forceSync, force: forceSync });
    console.log(`Models synchronized (alter=${alterSync && !forceSync}, force=${forceSync})`.green.bold);
};

export { sequelize, User, Product, Order, CartItem, Review };
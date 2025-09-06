import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [4, 30],
                notEmpty: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [8, 255],
                notEmpty: true
            }
        },
        avatar_public_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        avatar_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'user',
            allowNull: false
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetPasswordExpire: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            }
        }
    });

    // Instance methods
    User.prototype.comparePassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    User.prototype.getJWTToken = function() {
        return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
    };

    User.prototype.getResetPasswordToken = function() {
        const resetToken = crypto.randomBytes(20).toString("hex");
        this.resetPasswordToken = crypto.createHash('sha256')
            .update(resetToken)
            .digest("hex");
        this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
        return resetToken;
    };

    return User;
};
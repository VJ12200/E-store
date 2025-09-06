import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Review = sequelize.define('Review', {
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 1000]
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    helpful: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    notHelpful: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'not_helpful',
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
        name: 'unique_user_product_review'
      },
      {
        fields: ['product_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['rating']
      }
    ]
  });

  return Review;
};

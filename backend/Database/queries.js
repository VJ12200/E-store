// This file contains optimized SQL queries for:
// - Product search with complex filtering
// - Order analytics and aggregation
// - Review statistics and calculations
// - User analytics and reporting



import pool from './database.js';

//SEARCH QUERIES - filtering , sorting and limit, page for pagination
//pffset and limit are used for pagination

// Get all products with pagination
export const getAllProducts = async (page = 1, limit = 50) => {
  const connection = await pool.getConnection();
  const offset = (page - 1) * limit;
  
  try {
    // Simple query without parameters first
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.ratings,
        p.category,
        p.numof_reviews,
        p.images,
        p.stock,
        p.created_at,
        p.user_id
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const [rows] = await connection.execute(query);
    
    // Get total count for pagination
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM products p
    `);
    
    return {
      products: rows,
      totalCount: countResult[0].total,
      currentPage: page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
    
  } finally {
    connection.release();
  }
};

export const searchProducts = async (keyword, filters = {}, page = 1, limit = 10) => {
  const connection = await pool.getConnection();
  const offset = (page - 1) * limit;
  
  try {
    // empty array to store the where condition
    let whereConditions = [];
    //empty array to store values to replace the ? in the where condition
    let queryParams = [];
    
    // Keyword search
    if (keyword) {
        //add the where condition to the array
        //Select all the entries in the products table where the name column contains the keyword ? (Placeholder)
      whereConditions.push('p.name LIKE ?');
      queryParams.push(`%${keyword}%`);
//       Example: If keyword = "laptop", this adds:
// whereConditions = ["p.name LIKE ?"]
// queryParams = ["%laptop%"] (matches "Gaming Laptop", "Laptop Stand", etc.)
    }
    
    // Price range filter
    if (filters.minPrice > 0 && filters.minPrice <= 200_000) {
        //min price filter - only apply if price is positive
      whereConditions.push('p.price >= ?');
      queryParams.push(filters.minPrice);
    }
    if (filters.maxPrice > 0  && filters.maxPrice <= 200_000) {
        //max price filter - only apply if price is positive
      whereConditions.push('p.price <= ?');
      queryParams.push(filters.maxPrice);
    }

    // Category filter
    if (filters.category) {
      whereConditions.push('p.category = ?');
      queryParams.push(filters.category);
    }
    
    // Rating filter 1-5 stars 
    if (filters.minRating > 0 && filters.minRating <= 5) {
      whereConditions.push('p.ratings >= ?');
      queryParams.push(filters.minRating);
    }
    

    //FINAL WHERE CLAUSE
    //whereClause = "WHERE p.name LIKE ? AND p.price >= ? AND p.price <= ? AND p.category = ? AND p.ratings >= ?"
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    //if the whereConditions array is empty, then the whereClause is an empty string  otherwise the whereClause is the whereConditions array joined by AND
    


    // Build ORDER BY clause
    let orderBy = 'ORDER BY p.created_at DESC';
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = 'ORDER BY p.price ASC';
          break;
        case 'price_desc':
          orderBy = 'ORDER BY p.price DESC';
          break;
        case 'rating':
          orderBy = 'ORDER BY p.ratings DESC';
          break;
        case 'newest':
          orderBy = 'ORDER BY p.created_at DESC';
          break;
        case 'oldest':
          orderBy = 'ORDER BY p.created_at ASC';
          break;
      }
    }
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.ratings,
        p.category,
        p.numof_reviews,
        p.images,
        p.stock,
        p.created_at,
        u.name as seller_name,
        u.id as seller_id
      FROM products p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    //Pagination params
    queryParams.push(limit, offset);
    //Query executed
    const [rows] = await connection.execute(query, queryParams);

    //FINAL QUERY - 
    // SELECT p.id, p.name, p.description, p.price, p.ratings, p.category, p.numof_reviews, p.images, p.stock, p.created_at, u.name as seller_name, u.id as seller_id
    // FROM products p
    // JOIN users u ON p.user_id = u.id
    // WHERE p.name LIKE ? AND p.price >= ? AND p.category = ?
    // ORDER BY p.price ASC
    // LIMIT ? OFFSET ?
        
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;
    
    const [countResult] = await connection.execute(countQuery, queryParams.slice(0, -2));
    
    return {
        //When you execute a query with MySQL2, it returns an array where:
        // [0] = the actual data rows
        // [1] = metadata (field info, etc.)
      products: rows,
      totalCount: countResult[0].total,
      currentPage: page,
      totalPages: Math.ceil(countResult[0].total / limit)

    //   What it does: Computes how many pages of results there are.
    //   countResult[0].total: Total number of matching products (from the COUNT query).
    //   limit: How many products you show per page.
    //   Division: total ÷ per-page gives how many pages are needed.
    //   Math.ceil(...): Rounds up so partial pages count as a full page.
    //   Example:
    //   total = 95, limit = 10 → 95 / 10 = 9.5 → Math.ceil = 10 pages.
    //   total = 100, limit = 10 → 100 / 10 = 10 → Math.ceil = 10 pages.
    };
    
  } finally {
    connection.release();
  }
};



// ========================================
// PRODUCT ANALYTICS QUERIES

export const getFeaturedProducts = async (limit = 8) => {
  const connection = await pool.getConnection();
  
  try {
    // Get random products with good ratings and stock
    const [rows] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.ratings,
        p.category,
        p.numof_reviews,
        p.images,
        p.stock,
        p.created_at,
        p.user_id
      FROM products p
      WHERE p.stock > 0
      ORDER BY p.ratings DESC, RAND()
      LIMIT ${parseInt(limit)}
    `);
    
    return {
      products: rows,
      totalCount: rows.length,
      currentPage: 1,
      totalPages: 1
    };
  } finally {
    connection.release();
  }
};

export const getCategoryStats = async () => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(`
      SELECT 
        category,
        COUNT(*) as product_count,
        AVG(price) as avg_price,
        AVG(ratings) as avg_rating,
        SUM(stock) as total_stock
      FROM products
      GROUP BY category
      ORDER BY product_count DESC
    `);
    
    return rows;
  } finally {
    connection.release();
  }
};

// REVIEW QUERIES

// Get all reviews for a product
export const getProductReviews = async (productId, page = 1, limit = 10, sortBy = 'newest') => {
  const connection = await pool.getConnection();
  const offset = (page - 1) * limit;
  
  try {
    let orderBy = 'ORDER BY r.created_at DESC';
    if (sortBy) {
      switch (sortBy) {
        case 'newest':
          orderBy = 'ORDER BY r.created_at DESC';
          break;
        case 'oldest':
          orderBy = 'ORDER BY r.created_at ASC';
          break;
        case 'highest_rating':
          orderBy = 'ORDER BY r.rating DESC, r.created_at DESC';
          break;
        case 'lowest_rating':
          orderBy = 'ORDER BY r.rating ASC, r.created_at DESC';
          break;
        case 'most_helpful':
          orderBy = 'ORDER BY r.helpful DESC, r.created_at DESC';
          break;
      }
    }
    
    const [rows] = await connection.execute(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.helpful,
        r.not_helpful,
        r.is_verified,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [productId]);
    
    // Get total count
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.product_id = ?
    `, [productId]);
    
    return {
      reviews: rows,
      totalCount: countResult[0].total,
      currentPage: page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  } finally {
    connection.release();
  }
};

// Get user's reviews
export const getUserReviews = async (userId, page = 1, limit = 10) => {
  const connection = await pool.getConnection();
  const offset = (page - 1) * limit;
  
  try {
    const [rows] = await connection.execute(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.helpful,
        r.not_helpful,
        r.is_verified,
        r.created_at,
        r.updated_at,
        p.name as product_name,
        p.id as product_id,
        p.images as product_image
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [userId]);
    
    // Get total count
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.user_id = ?
    `, [userId]);
    
    return {
      reviews: rows,
      totalCount: countResult[0].total,
      currentPage: page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  } finally {
    connection.release();
  }
};

// Create a new review
export const createReview = async (reviewData) => {
  const connection = await pool.getConnection();
  
  try {
    const { userId, productId, rating, title, comment } = reviewData;
    
    const [result] = await connection.execute(`
      INSERT INTO reviews (user_id, product_id, rating, title, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [userId, productId, rating, title, comment]);
    
    // Get the created review
    const [review] = await connection.execute(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.helpful,
        r.not_helpful,
        r.is_verified,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [result.insertId]);
    
    return review[0];
  } finally {
    connection.release();
  }
};

// Get review by ID
export const getReviewById = async (reviewId) => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(`
      SELECT * FROM reviews WHERE id = ?
    `, [reviewId]);
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

// Get user's review for a specific product
export const getUserProductReview = async (userId, productId) => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(`
      SELECT * FROM reviews WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

// Update a review
export const updateReview = async (reviewId, updateData) => {
  const connection = await pool.getConnection();
  
  try {
    const { rating, title, comment } = updateData;
    const updates = [];
    const values = [];
    
    if (rating !== undefined) {
      updates.push('rating = ?');
      values.push(rating);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (comment !== undefined) {
      updates.push('comment = ?');
      values.push(comment);
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = NOW()');
    values.push(reviewId);
    
    await connection.execute(`
      UPDATE reviews 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    // Get the updated review
    const [review] = await connection.execute(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.helpful,
        r.not_helpful,
        r.is_verified,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [reviewId]);
    
    return review[0];
  } finally {
    connection.release();
  }
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(`
      DELETE FROM reviews WHERE id = ?
    `, [reviewId]);
    
    return true;
  } finally {
    connection.release();
  }
};

// Rate review helpfulness
export const rateReviewHelpfulness = async (reviewId, isHelpful) => {
  const connection = await pool.getConnection();
  
  try {
    if (isHelpful) {
      await connection.execute(`
        UPDATE reviews 
        SET helpful = helpful + 1, updated_at = NOW()
        WHERE id = ?
      `, [reviewId]);
    } else {
      await connection.execute(`
        UPDATE reviews 
        SET not_helpful = not_helpful + 1, updated_at = NOW()
        WHERE id = ?
      `, [reviewId]);
    }
    
    // Get updated review
    const [review] = await connection.execute(`
      SELECT helpful, not_helpful FROM reviews WHERE id = ?
    `, [reviewId]);
    
    return review[0];
  } finally {
    connection.release();
  }
};

// Get review statistics for a product
export const getReviewStats = async (productId) => {
  const connection = await pool.getConnection();
  
  try {
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE product_id = ?
    `, [productId]);
    
    return stats[0];
  } finally {
    connection.release();
  }
};

// Update product review statistics
export const updateProductReviewStats = async (productId) => {
  const connection = await pool.getConnection();
  
  try {
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as review_count,
        AVG(rating) as avg_rating
      FROM reviews
      WHERE product_id = ?
    `, [productId]);
    
    const { review_count, avg_rating } = stats[0];
    
    await connection.execute(`
      UPDATE products 
      SET 
        numof_reviews = ?,
        ratings = ?
      WHERE id = ?
    `, [review_count, avg_rating || 0, productId]);
    
    return true;
  } finally {
    connection.release();
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(`
      SELECT * FROM products WHERE id = ?
    `, [productId]);
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

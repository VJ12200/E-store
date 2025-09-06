import pool from '../../Database/database.js';

const getAllReviews = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            rating = '', 
            sortBy = 'created_at', 
            sortOrder = 'DESC' 
        } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let queryParams = [];
        
        // Build search conditions
        const conditions = [];
        if (search) {
            conditions.push('(r.title LIKE ? OR r.comment LIKE ? OR p.name LIKE ? OR u.name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (rating) {
            conditions.push('r.rating = ?');
            queryParams.push(rating);
        }
        
        if (conditions.length > 0) {
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['id', 'rating', 'created_at', 'helpful', 'not_helpful'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        // Ensure numeric and safe LIMIT/OFFSET values
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offsetNum = Math.max(0, parseInt(offset) || 0);
        
        const query = `
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
                p.images as product_image,
                u.name as user_name,
                u.id as user_id,
                u.email as user_email
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            ${whereClause}
            ORDER BY r.${sortField} ${sortDirection}
            LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
        
        const [reviews] = await connection.execute(query, queryParams);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            ${whereClause}
        `;
        const [countResult] = await connection.execute(countQuery, queryParams);
        
        res.json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult[0].total / limit),
                totalReviews: countResult[0].total,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getReviewById = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        
        const [reviews] = await connection.execute(`
            SELECT 
                r.*,
                p.name as product_name,
                p.id as product_id,
                p.images as product_image,
                u.name as user_name,
                u.id as user_id,
                u.email as user_email
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [id]);
        
        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.json({
            success: true,
            review: reviews[0]
        });
        
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const updateReview = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        const { rating, title, comment, is_verified } = req.body;
        
        // Check if review exists
        const [existingReviews] = await connection.execute(`
            SELECT id FROM reviews WHERE id = ?
        `, [id]);
        
        if (existingReviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }
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
        if (is_verified !== undefined) {
            updates.push('is_verified = ?');
            values.push(is_verified);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        updates.push('updated_at = NOW()');
        // Add the ID parameter to the end of values array for WHERE clause
        values.push(id);
        
        const updateQuery = `
            UPDATE reviews 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;
        
        await connection.execute(updateQuery, values);
        
        // Get updated review
        const [updatedReview] = await connection.execute(`
            SELECT 
                r.*,
                p.name as product_name,
                p.id as product_id,
                u.name as user_name,
                u.id as user_id
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [id]);
        
        // Update product review statistics if rating changed
        if (rating !== undefined) {
            const [productData] = await connection.execute(`
                SELECT product_id FROM reviews WHERE id = ?
            `, [id]);
            
            if (productData.length > 0) {
                const productId = productData[0].product_id;
                await connection.execute(`
                    UPDATE products 
                    SET 
                        numof_reviews = (
                            SELECT COUNT(*) FROM reviews 
                            WHERE product_id = ?
                        ),
                        ratings = (
                            SELECT COALESCE(AVG(rating), 0) FROM reviews 
                            WHERE product_id = ?
                        )
                    WHERE id = ?
                `, [productId, productId, productId]);
            }
        }
        
        res.json({
            success: true,
            message: 'Review updated successfully',
            review: updatedReview[0]
        });
        
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const deleteReview = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        
        // Get product_id before deleting
        const [reviewData] = await connection.execute(`
            SELECT product_id FROM reviews WHERE id = ?
        `, [id]);
        
        if (reviewData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        const productId = reviewData[0].product_id;
        
        // Delete review
        await connection.execute(`
            DELETE FROM reviews WHERE id = ?
        `, [id]);
        
        // Update product review statistics
        await connection.execute(`
            UPDATE products 
            SET 
                numof_reviews = (
                    SELECT COUNT(*) FROM reviews 
                    WHERE product_id = ?
                ),
                ratings = COALESCE((
                    SELECT AVG(rating) FROM reviews 
                    WHERE product_id = ?
                ), 0)
            WHERE id = ?
        `, [productId, productId, productId]);
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getReviewStats = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_reviews,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_reviews,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_reviews,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_reviews,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_reviews,
                COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_reviews
            FROM reviews
        `);
        
        const [recentReviews] = await connection.execute(`
            SELECT 
                r.id,
                r.rating,
                r.title,
                r.created_at,
                p.name as product_name,
                u.name as user_name
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 10
        `);
        
        const [topProducts] = await connection.execute(`
            SELECT 
                p.id,
                p.name,
                COUNT(r.id) as review_count,
                AVG(r.rating) as avg_rating
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            GROUP BY p.id, p.name
            HAVING review_count > 0
            ORDER BY review_count DESC, avg_rating DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            stats: stats[0],
            recentReviews,
            topProducts
        });
        
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review statistics',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const bulkDeleteReviews = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { reviewIds } = req.body;
        
        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Review IDs array is required'
            });
        }
        
        // Create placeholders for the IN clause
        const placeholders = reviewIds.map(() => '?').join(',');
        
        // Get product IDs before deleting
        const [productIds] = await connection.execute(`
            SELECT DISTINCT product_id FROM reviews WHERE id IN (${placeholders})
        `, reviewIds);
        
        // Delete reviews
        await connection.execute(`
            DELETE FROM reviews WHERE id IN (${placeholders})
        `, reviewIds);
        
        // Update product review statistics for affected products
        for (const product of productIds) {
            await connection.execute(`
                UPDATE products 
                SET 
                    numof_reviews = (
                        SELECT COUNT(*) FROM reviews 
                        WHERE product_id = ?
                    ),
                    ratings = COALESCE((
                        SELECT AVG(rating) FROM reviews 
                        WHERE product_id = ?
                    ), 0)
                WHERE id = ?
            `, [product.product_id, product.product_id, product.product_id]);
        }
        
        res.json({
            success: true,
            message: `${reviewIds.length} reviews deleted successfully`
        });
        
    } catch (error) {
        console.error('Error bulk deleting reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete reviews',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

export { getAllReviews, getReviewById, updateReview, deleteReview, getReviewStats, bulkDeleteReviews };



import pool from '../../Database/database.js';
import { User } from '../../Database/index.js';

const getAllProducts = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { page = 1, limit = 20, search = '', category = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let queryParams = [];
        
        // Build search conditions
        const conditions = [];
        if (search) {
            conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            conditions.push('p.category = ?');
            queryParams.push(category);
        }
        
        if (conditions.length > 0) {
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['id', 'name', 'price', 'stock', 'ratings', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Ensure numeric and safe LIMIT/OFFSET values
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offsetNum = Math.max(0, parseInt(offset) || 0);


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
                p.updated_at,
                u.name as seller_name,
                u.id as seller_id
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.${sortField} ${sortDirection}
            LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
        
        const [products] = await connection.execute(query, queryParams);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            ${whereClause}
        `;
        const [countResult] = await connection.execute(countQuery, queryParams);
        
        res.json({
            success: true,
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult[0].total / limit),
                totalProducts: countResult[0].total,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getProductById = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        
        const [products] = await connection.execute(`
            SELECT 
                p.*,
                u.name as seller_name,
                u.id as seller_id
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [id]);
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            product: products[0]
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const createProduct = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const {
            name,
            description,
            price,
            category,
            images,
            stock,
            sellerId
        } = req.body;
        
        // Validate required fields
        if (!name || !description || !price || !category || !sellerId) {
            return res.status(400).json({
                success: false,
                message: 'Name, description, price, category, and sellerId are required'
            });
        }
        
        // Validate price and stock
        if (price < 0 || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price and stock must be non-negative'
            });
        }

        // Resolve seller user id: prefer provided sellerId, fallback to authenticated user
        const resolvedSellerId = Number.isInteger(parseInt(sellerId)) && parseInt(sellerId) > 0
            ? parseInt(sellerId)
            : (req.user && req.user.id ? parseInt(req.user.id) : null);

        if (!resolvedSellerId) {
            return res.status(400).json({
                success: false,
                message: 'Valid sellerId is required'
            });
        }

        // Ensure seller exists; if not, create a new seller user
        const [sellerRows] = await connection.execute(`
            SELECT id FROM users WHERE id = ?
        `, [resolvedSellerId]);

        let finalSellerId = resolvedSellerId;
        if (sellerRows.length === 0) {
            const generatedEmail = `seller${Date.now()}@estore.com`;
            const sellerName = req.body.sellerName && String(req.body.sellerName).trim() ? String(req.body.sellerName).trim() : `Seller ${Date.now()}`;
            // Create via Sequelize so password hashing hooks apply
            const newSeller = await User.create({
                name: sellerName,
                email: req.body.sellerEmail && String(req.body.sellerEmail).trim() ? String(req.body.sellerEmail).trim() : generatedEmail,
                password: 'Seller@123456',
                role: 'user'
            });
            finalSellerId = newSeller.id;
        }
        
        // Normalize images for JSON column: allow blank, JSON text, or single URL
        let normalizedImages;
        const imagesInput = images !== undefined && images !== null ? String(images).trim() : '';
        if (!imagesInput) {
            normalizedImages = JSON.stringify([]);
        } else {
            try {
                const parsed = JSON.parse(imagesInput);
                normalizedImages = JSON.stringify(parsed);
            } catch (_) {
                // Not valid JSON; treat as a single URL string
                normalizedImages = JSON.stringify([imagesInput]);
            }
        }

        const [result] = await connection.execute(`
            INSERT INTO products (name, description, price, category, images, stock, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [name, description, price, category, normalizedImages, stock || 0, finalSellerId]);
        
        // Get the created product
        const [newProduct] = await connection.execute(`
            SELECT 
                p.*,
                u.name as seller_name,
                u.id as seller_id
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: newProduct[0]
        });
        
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const updateProduct = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            category,
            images,
            stock
        } = req.body;
        
        // Check if product exists
        const [existingProducts] = await connection.execute(`
            SELECT id FROM products WHERE id = ?
        `, [id]);
        
        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            if (price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be non-negative'
                });
            }
            updates.push('price = ?');
            values.push(price);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }
        if (images !== undefined) {
            updates.push('images = ?');
            values.push(images);
        }
        if (stock !== undefined) {
            if (stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock must be non-negative'
                });
            }
            updates.push('stock = ?');
            values.push(stock);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        updates.push('updated_at = NOW()');
        values.push(id);
        
        await connection.execute(`
            UPDATE products 
            SET ${updates.join(', ')}
            WHERE id = ?
        `, values);
        
        // Get updated product
        const [updatedProduct] = await connection.execute(`
            SELECT 
                p.*,
                u.name as seller_name,
                u.id as seller_id
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [id]);
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct[0]
        });
        
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const deleteProduct = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { id } = req.params;
        
        // Check if product exists
        const [existingProducts] = await connection.execute(`
            SELECT id FROM products WHERE id = ?
        `, [id]);
        
        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Delete product (cascade will handle related records)
        await connection.execute(`
            DELETE FROM products WHERE id = ?
        `, [id]);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getProductStats = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock_products,
                COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_products,
                AVG(price) as average_price,
                AVG(ratings) as average_rating,
                COUNT(DISTINCT category) as total_categories
            FROM products
        `);
        
        const [categoryStats] = await connection.execute(`
            SELECT 
                category,
                COUNT(*) as product_count,
                AVG(price) as avg_price,
                SUM(stock) as total_stock
            FROM products
            GROUP BY category
            ORDER BY product_count DESC
        `);
        
        res.json({
            success: true,
            stats: stats[0],
            categoryStats
        });
        
    } catch (error) {
        console.error('Error fetching product stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product statistics',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

export { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductStats };



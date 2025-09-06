import pool from '../Database/database.js';

const createOrder = async (req, res) => {
    // Create order
    
    const connection = await pool.getConnection();
    
    try {
        const {
            shipping,
            payment,
            billing,
            items,
            subtotal,
            shippingCost,
            tax,
            total
        } = req.body;

        const userId = req.user.id;

        // Start transaction
        await connection.beginTransaction();

        // Prepare billing values
        const billingFirstName = (billing && billing.firstName && billing.firstName.trim()) ? billing.firstName : shipping.firstName;
        const billingLastName = (billing && billing.lastName && billing.lastName.trim()) ? billing.lastName : shipping.lastName;
        const billingAddress = (billing && billing.address && billing.address.trim()) ? billing.address : shipping.address;
        const billingCity = (billing && billing.city && billing.city.trim()) ? billing.city : shipping.city;
        const billingState = (billing && billing.state && billing.state.trim()) ? billing.state : shipping.state;
        const billingZipCode = (billing && billing.zipCode && billing.zipCode.trim()) ? billing.zipCode : shipping.zipCode;
        const billingCountry = (billing && billing.country && billing.country.trim()) ? billing.country : shipping.country;
        
        // Billing resolved

        // Create order
        const orderParams = [
            userId,
            'processing',
            subtotal,
            shippingCost,
            tax,
            total,
            shipping.firstName,
            shipping.lastName,
            shipping.address,
            shipping.city,
            shipping.state,
            shipping.zipCode,
            shipping.country,
            billingFirstName,
            billingLastName,
            billingAddress,
            billingCity,
            billingState,
            billingZipCode,
            billingCountry,
            payment.cardNumber.replace(/\d(?=\d{4})/g, "*"), // Mask card number
            payment.cardExpiry,
            '***', // Don't store CVV
            payment.cardName
        ];
        
        // Insert order and items

        const [orderResult] = await connection.execute(
            `INSERT INTO orders (user_id, status, subtotal, shipping_cost, tax, total, 
             shipping_first_name, shipping_last_name, shipping_address, shipping_city, 
             shipping_state, shipping_zip_code, shipping_country,
             billing_first_name, billing_last_name, billing_address, billing_city,
             billing_state, billing_zip_code, billing_country,
             payment_card_number, payment_card_expiry, payment_card_cvv, payment_card_name,
             created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            orderParams
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of items) {
            await connection.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [orderId, item.productId, item.quantity, item.price]
            );

            // Update product stock
            await connection.execute(
                `UPDATE products SET stock = stock - ? WHERE id = ?`,
                [item.quantity, item.productId]
            );
        }

        // Clear user's cart
        await connection.execute(
            `DELETE FROM cart_items WHERE user_id = ?`,
            [userId]
        );

        // Commit transaction
        await connection.commit();

        res.json({
            success: true,
            message: 'Order created successfully',
            orderId: orderId
        });

    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error('Error creating order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getUserOrders = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const userId = req.user.id;

        // Get orders with items
        const [orders] = await connection.execute(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'productId', oi.product_id,
                            'productName', p.name,
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ? AND o.status IN ('processing', 'in_transit', 'out_for_delivery')
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );

        // Parse items JSON
        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: parseFloat(order.subtotal),
            shipping_cost: parseFloat(order.shipping_cost),
            tax: parseFloat(order.tax),
            total: parseFloat(order.total),
            shipping: {
                firstName: order.shipping_first_name,
                lastName: order.shipping_last_name,
                address: order.shipping_address,
                city: order.shipping_city,
                state: order.shipping_state,
                zipCode: order.shipping_zip_code,
                country: order.shipping_country
            },
            items: order.items ? JSON.parse(`[${order.items}]`) : [],
            createdAt: order.created_at,
            updatedAt: order.updated_at
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getOrderHistory = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const userId = req.user.id;

        // Get all orders with items
        const [orders] = await connection.execute(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'productId', oi.product_id,
                            'productName', p.name,
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ? AND o.status = 'delivered'
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );

        // Parse items JSON
        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: parseFloat(order.subtotal),
            shipping_cost: parseFloat(order.shipping_cost),
            tax: parseFloat(order.tax),
            total: parseFloat(order.total),
            shipping: {
                firstName: order.shipping_first_name,
                lastName: order.shipping_last_name,
                address: order.shipping_address,
                city: order.shipping_city,
                state: order.shipping_state,
                zipCode: order.shipping_zip_code,
                country: order.shipping_country
            },
            items: order.items ? JSON.parse(`[${order.items}]`) : [],
            createdAt: order.created_at,
            updatedAt: order.updated_at
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });

    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order history',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

export { createOrder, getUserOrders, getOrderHistory };
import { CartItem, Product, User } from '../Database/index.js';

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description', 'price', 'stock', 'category', 'images']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        let totalPrice = 0;
        let totalItems = 0;

        cartItems.forEach(item => {
            totalPrice += item.product.price * item.quantity;
            totalItems += item.quantity;
        });

        res.status(200).json({
            success: true,
            cartItems,
            totalPrice,
            totalItems
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart',
            error: error.message
        });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.id;

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if product is in stock
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({
            where: { userId, productId }
        });

        if (cartItem) {
            // Update quantity if item exists
            const newQuantity = cartItem.quantity + quantity;
            
            // Check stock again
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }
            
            cartItem.quantity = newQuantity;
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                userId,
                productId,
                quantity
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cartItem
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;
        const userId = req.user.id;

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId },
            include: [{ model: Product, as: 'product' }]
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Check product stock
        if (cartItem.product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cartItem
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item',
            error: error.message
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const userId = req.user.id;

        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId }
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        await cartItem.destroy();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await CartItem.destroy({
            where: { userId }
        });

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
};

const getCartCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await CartItem.count({
            where: { userId }
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart count',
            error: error.message
        });
    }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount };
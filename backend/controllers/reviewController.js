import { ReviewService } from '../services/reviewService.js';

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
        
        const result = await ReviewService.getProductReviews(
            parseInt(productId),
            parseInt(page),
            parseInt(limit),
            sortBy
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Reviews retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch reviews',
                data: []
            });
        }
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            data: []
        });
    }
};

const getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const result = await ReviewService.getUserReviews(
            userId,
            parseInt(page),
            parseInt(limit)
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'User reviews retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch user reviews',
                data: []
            });
        }
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            data: []
        });
    }
};

const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, title, comment } = req.body;
        
        // Validate required fields
        if (!productId || !rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }
        
        const result = await ReviewService.createReview({
            userId,
            productId: parseInt(productId),
            rating: parseInt(rating),
            title: title.trim(),
            comment: comment.trim()
        });
        
        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Review created successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to create review'
            });
        }
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        
        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }
        
        const result = await ReviewService.updateReview(
            parseInt(reviewId),
            userId,
            {
                rating: rating ? parseInt(rating) : undefined,
                title: title ? title.trim() : undefined,
                comment: comment ? comment.trim() : undefined
            }
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to update review'
            });
        }
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        
        const result = await ReviewService.deleteReview(
            parseInt(reviewId),
            userId
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Review deleted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to delete review'
            });
        }
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const rateReviewHelpfulness = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { isHelpful } = req.body;
        
        const result = await ReviewService.rateReviewHelpfulness(
            parseInt(reviewId),
            isHelpful === true
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Review rating updated successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to rate review'
            });
        }
    } catch (error) {
        console.error('Rate review helpfulness error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getReviewStats = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const result = await ReviewService.getReviewStats(parseInt(productId));
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Review statistics retrieved successfully',
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch review statistics',
                data: null
            });
        }
    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            data: null
        });
    }
};

export { getProductReviews, getUserReviews, createReview, updateReview, deleteReview, rateReviewHelpfulness, getReviewStats };
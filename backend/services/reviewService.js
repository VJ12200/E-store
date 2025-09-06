import * as queries from '../Database/queries.js';

class ReviewService {
  
  // Get all reviews for a product
  static async getProductReviews(productId, page = 1, limit = 10, sortBy = 'newest') {
    try {
      const result = await queries.getProductReviews(productId, page, limit, sortBy);
      
      return {
        success: true,
        data: result.reviews,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1
        }
      };
    } catch (error) {
      console.error('Get product reviews service error:', error);
      return {
        success: false,
        error: 'Failed to fetch product reviews',
        data: []
      };
    }
  }

  // Get user's reviews
  static async getUserReviews(userId, page = 1, limit = 10) {
    try {
      const result = await queries.getUserReviews(userId, page, limit);
      
      return {
        success: true,
        data: result.reviews,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1
        }
      };
    } catch (error) {
      console.error('Get user reviews service error:', error);
      return {
        success: false,
        error: 'Failed to fetch user reviews',
        data: []
      };
    }
  }

  // Create a new review
  static async createReview(reviewData) {
    try {
      const { userId, productId, rating, title, comment } = reviewData;
      
      // Check if user already reviewed this product
      const existingReview = await queries.getUserProductReview(userId, productId);
      if (existingReview) {
        return {
          success: false,
          error: 'You have already reviewed this product'
        };
      }
      
      // Check if product exists
      const product = await queries.getProductById(productId);
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }
      
      const result = await queries.createReview({
        userId,
        productId,
        rating,
        title,
        comment
      });
      
      // Update product rating and review count
      await queries.updateProductReviewStats(productId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Create review service error:', error);
      return {
        success: false,
        error: 'Failed to create review'
      };
    }
  }

  // Update a review
  static async updateReview(reviewId, userId, updateData) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await queries.getReviewById(reviewId);
      if (!existingReview) {
        return {
          success: false,
          error: 'Review not found'
        };
      }
      
      if (existingReview.userId !== userId) {
        return {
          success: false,
          error: 'You can only update your own reviews'
        };
      }
      
      const result = await queries.updateReview(reviewId, updateData);
      
      // Update product rating and review count
      await queries.updateProductReviewStats(existingReview.productId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Update review service error:', error);
      return {
        success: false,
        error: 'Failed to update review'
      };
    }
  }

  // Delete a review
  static async deleteReview(reviewId, userId) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await queries.getReviewById(reviewId);
      if (!existingReview) {
        return {
          success: false,
          error: 'Review not found'
        };
      }
      
      if (existingReview.userId !== userId) {
        return {
          success: false,
          error: 'You can only delete your own reviews'
        };
      }
      
      await queries.deleteReview(reviewId);
      
      // Update product rating and review count
      await queries.updateProductReviewStats(existingReview.productId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete review service error:', error);
      return {
        success: false,
        error: 'Failed to delete review'
      };
    }
  }

  // Rate review helpfulness
  static async rateReviewHelpfulness(reviewId, isHelpful) {
    try {
      const result = await queries.rateReviewHelpfulness(reviewId, isHelpful);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Rate review helpfulness service error:', error);
      return {
        success: false,
        error: 'Failed to rate review'
      };
    }
  }

  // Get review statistics for a product
  static async getReviewStats(productId) {
    try {
      const result = await queries.getReviewStats(productId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Get review stats service error:', error);
      return {
        success: false,
        error: 'Failed to fetch review statistics',
        data: null
      };
    }
  }
}

export { ReviewService };
// High-Performance Search Service using SQL2
import * as queries from '../Database/queries.js';

class SearchService {
  
  // Get all products
  static async getAllProducts(page = 1, limit = 50) {
    try {
      const result = await queries.getAllProducts(page, limit);
      
      return {
        success: true,
        data: result.products,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1
        }
      };
    } catch (error) {
      console.error('Get all products service error:', error);
      return {
        success: false,
        error: 'Failed to fetch products',
        data: []
      };
    }
  }
  
  // Advanced product search with filtering and sorting
  static async searchProducts(searchParams) {
    const {
      keyword = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      minRating = 0,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = searchParams;
    
    const filters = {
      category: category || undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 999999 ? maxPrice : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      sortBy
    };
    
    try {
      const result = await queries.searchProducts(keyword, filters, page, limit);
      
      return {
        success: true,
        data: result.products,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1
        }
      };
    } catch (error) {
      console.error('Search service error:', error);
      return {
        success: false,
        error: 'Search failed',
        data: []
      };
    }
  }
  
  // Get popular search suggestions
  static async getSearchSuggestions(keyword, limit = 5) {
    // This could be enhanced with a search history table
    // For now, return category suggestions
    try {
      const result = await queries.getCategoryStats();
      const suggestions = result
        .filter(cat => cat.category.toLowerCase().includes(keyword.toLowerCase()))
        .slice(0, limit)
        .map(cat => cat.category);
      
      return {
        success: true,
        suggestions
      };
    } catch (error) {
      console.error('Search suggestions error:', error);
      return {
        success: false,
        suggestions: []
      };
    }
  }
  
  // Get filtered products by category
  static async getProductsByCategory(category, page = 1, limit = 10) {
    return await this.searchProducts({
      category,
      page,
      limit
    });
  }
  
  // Get featured products (high-rated, in-stock)
  static async getFeaturedProducts(limit = 8) {
    try {
      const result = await queries.getFeaturedProducts(limit);
      
      return {
        success: true,
        data: result.products,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1
        }
      };
    } catch (error) {
      console.error('Get featured products service error:', error);
      return {
        success: false,
        error: 'Failed to fetch featured products',
        data: []
      };
    }
  }
}

export { SearchService };

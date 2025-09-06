// High-Performance Analytics Service using SQL2
import * as queries from '../Database/queries.js';

class AnalyticsService {
  
  // Get top-selling products
  static async getTopSellingProducts(limit = 10, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    
    try {
      const products = await queries.getTopSellingProducts(limit, startDate, endDate);
      
      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Error', error);
      return {
        success: false,
        error: 'Failed to fetch top selling products',
        data: []
      };
    }
  }
  
  // Get category statistics
  static async getCategoryStats() {
    try {
      const stats = await queries.getCategoryStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Category stats error:', error);
      return {
        success: false,
        error: 'Failed to fetch category statistics',
        data: []
      };
    }
  }
  
}

export { AnalyticsService };

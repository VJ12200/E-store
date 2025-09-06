// High-Performance Analytics Service using SQL2
import * as queries from '../Database/queries.js';

class AnalyticsService {
  
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

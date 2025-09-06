import { AnalyticsService } from '../services/analyticsService.js';

const getCategoryStats = async (req, res) => {
    try {
        const result = await AnalyticsService.getCategoryStats();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Category statistics retrieved successfully',
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch category statistics',
                data: []
            });
        }
    } catch (error) {
        console.error('Category stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getCategoryStats };

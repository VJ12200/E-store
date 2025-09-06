import { AnalyticsService } from '../services/analyticsService.js';

const getTopSellingProducts = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        
        const dateRange = {};
        if (startDate) dateRange.startDate = startDate;
        if (endDate) dateRange.endDate = endDate;
        
        const result = await AnalyticsService.getTopSellingProducts(
            parseInt(limit),
            dateRange
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Top selling products retrieved successfully',
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch top selling products',
                data: []
            });
        }
    } catch (error) {
        console.error('Top selling products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

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

export { getTopSellingProducts, getCategoryStats };
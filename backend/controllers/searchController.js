import { SearchService } from '../services/searchService.js';

const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const result = await SearchService.getAllProducts(
            parseInt(page),
            parseInt(limit)
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Products retrieved successfully',
                products: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch products',
                products: []
            });
        }
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            products: []
        });
    }
};

const searchProducts = async (req, res) => {
    try {
        const {
            keyword = '',
            category = '',
            minPrice = 0,
            maxPrice = 999999,
            minRating = 0,
            sortBy = 'newest',
            page = 1,
            limit = 10
        } = req.query;
        
        const searchParams = {
            keyword,
            category,
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice),
            minRating: parseFloat(minRating),
            sortBy,
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const result = await SearchService.searchProducts(searchParams);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Search completed successfully',
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Search failed',
                data: []
            });
        }
    } catch (error) {
        console.error('Search controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getSearchSuggestions = async (req, res) => {
    try {
        const { keyword = '' } = req.query;
        
        if (!keyword || keyword.length < 2) {
            return res.status(200).json({
                success: true,
                suggestions: []
            });
        }
        
        const result = await SearchService.getSearchSuggestions(keyword);
        
        res.status(200).json({
            success: true,
            suggestions: result.suggestions || []
        });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get search suggestions',
            suggestions: []
        });
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const result = await SearchService.getProductsByCategory(
            category,
            parseInt(page),
            parseInt(limit)
        );
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: `Products in ${category} category`,
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                data: []
            });
        }
    } catch (error) {
        console.error('Category products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const result = await SearchService.getFeaturedProducts(parseInt(limit));
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Featured products retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured products',
                data: []
            });
        }
    } catch (error) {
        console.error('Featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getAllProducts, searchProducts, getSearchSuggestions, getProductsByCategory, getFeaturedProducts };
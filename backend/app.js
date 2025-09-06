import './config/env.js';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';

// Route imports
import usersRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';
import searchRouter from './routes/searchRoutes.js';
import analyticsRouter from './routes/analyticsRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import adminRouter from './routes/admin/index.js';

// Service imports
import { initializeDatabase } from './Database/index.js';
import notFound from './middleware/notFound.js';
import emailService from './services/emailService.js';

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// API Routes
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api', cartRouter);
app.use('/api', orderRouter);
app.use('/api/admin', adminRouter);

// Static HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'home.html'));
});

app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'checkout.html'));
});

app.get('/order-success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'order-success.html'));
});

app.get('/products.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'products.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'cart.html'));
});

app.get('/product-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'product-detail.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'admin.html'));
});

// Removed orphan analytics static page route

// Error handling middleware
app.use(notFound);
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  await initializeDatabase();
  await emailService.initialize();
});

export default app;
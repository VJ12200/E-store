import express from 'express';
import pool from '../../Database/database.js';

const router = express.Router();

// List all orders with basic info and items count
router.get('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT o.id, o.user_id, o.status, o.total, o.created_at,
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, orders: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
  } finally {
    connection.release();
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const allowed = ['processing', 'in_transit', 'out_for_delivery', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [result] = await connection.execute(
      `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, message: 'Status updated', storedStatus: status });
  } catch (err) {
    console.error('Admin update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  } finally {
    connection.release();
  }
});

export default router;



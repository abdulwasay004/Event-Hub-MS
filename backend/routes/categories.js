const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category_id, name, description
      FROM categories
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT category_id, name, description FROM categories WHERE category_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;

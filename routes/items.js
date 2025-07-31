const express = require('express');
const db = require('../data/database');

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM items', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = rows.map(i => ({
      ...i,
      links: [{ rel: 'self', href: `/api/items/${i.id}` }]
    }));

    res.json(result);
  });
});

router.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

  const sql = 'INSERT INTO items (name, type) VALUES (?, ?)';
  db.run(sql, [name, type], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      name,
      type,
      links: [{ rel: 'self', href: `/api/items/${this.lastID}` }]
    });
  });
});

module.exports = router;

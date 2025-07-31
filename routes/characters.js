const express = require('express');
const db = require('../data/database');

const router = express.Router();

// Listar todos personagens
router.get('/', (req, res) => {
  db.all('SELECT * FROM characters', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = rows.map((c) => ({
      ...c,
      links: [
        { rel: 'self', href: `/api/characters/${c.id}` },
        { rel: 'items', href: `/api/characters/${c.id}/items` },
      ],
    }));

    res.json(result);
  });
});

// Rota POST /api/characters
router.post('/', (req, res) => {
  const { name, level } = req.body;
  if (!name || !level)
    return res.status(400).json({ error: 'Nome e nível são obrigatórios' });

  const sql = 'INSERT INTO characters (name, level) VALUES (?, ?)';
  db.run(sql, [name, level], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      name,
      level,
      links: [
        { rel: 'self', href: `/api/characters/${this.lastID}` },
        { rel: 'items', href: `/api/characters/${this.lastID}/items` },
      ],
    });
  });
});

// Listar itens do personagem (detalhado)
router.get('/:id/items', (req, res) => {
  const characterId = req.params.id;

  db.get(
    'SELECT * FROM characters WHERE id = ?',
    [characterId],
    (err, character) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!character)
        return res.status(404).json({ error: 'Personagem não encontrado' });

      const sql = `
      SELECT items.id, items.name, items.type
      FROM items
      INNER JOIN character_items ON items.id = character_items.item_id
      WHERE character_items.character_id = ?
    `;

      db.all(sql, [characterId], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          character: character.name,
          items,
          links: [
            { rel: 'self', href: `/api/characters/${characterId}/items` },
            { rel: 'character', href: `/api/characters/${characterId}` },
          ],
        });
      });
    },
  );
});

router.post('/:id/items', (req, res) => {
  const characterId = req.params.id;
  const { item_id } = req.body;

  if (!item_id) return res.status(400).json({ error: 'item_id é obrigatório' });

  db.get(
    'SELECT * FROM characters WHERE id = ?',
    [characterId],
    (err, character) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!character)
        return res.status(404).json({ error: 'Personagem não encontrado' });

      db.get('SELECT * FROM items WHERE id = ?', [item_id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item)
          return res.status(404).json({ error: 'Item não encontrado' });

        const sql =
          'INSERT OR IGNORE INTO character_items (character_id, item_id) VALUES (?, ?)';
        db.run(sql, [characterId, item_id], function (err) {
          if (err) return res.status(500).json({ error: err.message });

          res.status(201).json({
            message: `Item '${item.name}' adicionado ao personagem '${character.name}'`,
            links: [
              { rel: 'self', href: `/api/characters/${characterId}/items` },
              { rel: 'character', href: `/api/characters/${characterId}` },
            ],
          });
        });
      });
    },
  );
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');

const charactersRoutes = require('./routes/characters');
const itemsRoutes = require('./routes/items');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/characters', charactersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API REST rodando em http://localhost:${PORT}`);
});

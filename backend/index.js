const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is up', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Server running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

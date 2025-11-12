// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;






// Allow your frontend to access the server
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// Route to fetch the banana API
app.get('/banana', async (req, res) => {
  try {
    const response = await fetch('https://marcconrad.com/uob/banana/');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch API' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

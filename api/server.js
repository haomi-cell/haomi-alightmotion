const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "e329d3cb861969fe599ef5fe";
const ACCESS_TOKEN = "aks-1d3bd53f4d857a690a77471d";
const BASE_URL = "https://ndxhs.my.id";

app.post('/api/send', async (req, res) => {
  try {
    const { email } = req.body;
    const response = await fetch(`${BASE_URL}/send?email=${encodeURIComponent(email)}`, {
      headers: { "X-Zen-Key": API_KEY, "X-Zen-Access": ACCESS_TOKEN }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error" });
  }
});

app.post('/api/bulk', async (req, res) => {
  try {
    const { amount } = req.body;
    const response = await fetch(`${BASE_URL}/bulk?amount=${amount}`, {
      headers: { "X-Zen-Key": API_KEY, "X-Zen-Access": ACCESS_TOKEN }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error" });
  }
});

app.post('/api/inbox', async (req, res) => {
  try {
    const { email } = req.body;
    const response = await fetch(`${BASE_URL}/tempmail-read?email=${encodeURIComponent(email)}`, {
      headers: { "X-Zen-Key": API_KEY, "X-Zen-Access": ACCESS_TOKEN }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
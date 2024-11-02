// index.js
const express = require('express');
const cors = require('cors');
const { generateSessionAndFetchData } = require('./smartApiClient');

const app = express();
const PORT = 3000;

// Use CORS middleware
app.use(cors());

// Define an endpoint to get the candle data
app.get('/api/candle-data', async (req, res) => {
    try {
        const response = await generateSessionAndFetchData();
        res.json({ stocksData: response });
    } catch (error) {
        console.error("Failed to get candle data:", error);
        res.status(500).json({ error: "Failed to get candle data" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
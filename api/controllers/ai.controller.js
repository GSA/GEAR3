const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // Allow Angular frontend to connect
app.use(express.json()); // Parse JSON bodies

app.post('/api/external-call', async (req, res) => {
    const externalApiUrl = 'https://api.gsa.usai.gov/api/v1/chat/completions';
    const apiKey = 'api-key-e84fd146-9b4e-4b49-bf33-82e19d5bf108:rAH7jhqZk9hrFEjKCDweS39M6kuaRORv'; // process.env.API_KEY; // Best practice: use env variables

    try {
        const clientData = req.body; // Data received from Angular

        // Forward data to external API
        const response = await axios.post(externalApiUrl, clientData, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        // Send external API's response back to Angular
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
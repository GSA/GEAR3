const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors()); // Allow Angular frontend to connect
app.use(express.json()); // Parse JSON bodies

app.post('/api/external-call', async (req, res) => {
    const externalApiUrlPost = 'https://api.gsa.usai.gov/api/v1/chat/completions';
    const externalApiUrlGet = 'https://api.gsa.usai.gov/api/v1/models';
    const apiKey = process.env.GSAI_DEV_API_KEY;

    try {
        const clientData = req.body; // Data received from Angular

        console.log('CLIENT DATA: ', clientData);

        // Forward data to external API
        // const response = await axios.get(externalApiUrlGet, {
        //     headers: { 'Authorization': `Bearer ${apiKey}` }
        // });
        const response = await axios.post(externalApiUrlPost, clientData, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        console.log('API RESPONSE:', response);

        // Send external API's response back to Angular
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));
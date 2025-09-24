// pages/api/predict-yield.js

import { Client } from "@gradio/client";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
  const { district, crop, season, year, area } = req.body;

  if (!district || !crop || !season || !year || !area || isNaN(parseFloat(year)) || isNaN(parseFloat(area))) {
    return res.status(400).json({ message: 'Missing or invalid parameters. Please ensure all fields are filled correctly.' });
  }

  try {
    const client = await Client.connect("rockstar00/Odisha-Crop-Yield-Predictor", {
      hf_token: HF_ACCESS_TOKEN,
    });

    const result = await client.predict("/predict_yield", [
      district,
      crop,
      season,
      parseInt(year, 10),
      parseFloat(area),
    ]);
    
    // Check if the server returned an error string instead of the prediction.
    if (typeof result.data[0] === 'string' && result.data[0].includes('Error')) {
        console.error('API Error:', result.data[0]);
        return res.status(400).json({ message: result.data[0] });
    }

    const markdownString = result.data[0];

    const yieldMatch = markdownString.match(/## ([\d.]+) Tons per Hectare/);

    if (!yieldMatch) {
      console.error('API response could not be parsed:', markdownString);
      return res.status(500).json({ message: 'Could not parse yield from server response.' });
    }

    const predictedYield = parseFloat(yieldMatch[1]);

    if (isNaN(predictedYield)) {
      return res.status(500).json({ message: 'Prediction returned an invalid number.' });
    }

    res.status(200).json({
      predictedYield: predictedYield,
      message: 'Prediction successful',
    });

  } catch (error) {
    console.error('API call to Hugging Face failed:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
}
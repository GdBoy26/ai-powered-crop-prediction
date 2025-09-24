/**
 * Communicates with the Hugging Face Gradio API to get a crop yield prediction.
 *
 * @param {object} formData - An object containing the farmer's input.
 * @param {string} formData.district - The selected district.
 * @param {string} formData.crop - The selected crop.
 * @param {string} formData.season - The selected season.
 * @param {number} formData.year - The planting year.
 * @param {number} formData.area - The cultivation area in hectares.
 * @returns {Promise<string>} A promise that resolves to the prediction result.
 * @throws {Error} Throws an error if the API call fails.
 */
import { Client } from "@gradio/client";

export async function getYieldPrediction({ district, crop, season, year, area }) {
    try {
        const client = await Client.connect("rockstar00/Odisha-Crop-Yield-Predictor");

        // The input for client.predict() must be an array of values,
        // in the exact same order as the function parameters in app.py.
        const result = await client.predict("/predict_yield", [
            // Parameter 1: district
            district,
            // Parameter 2: crop
            crop,
            // Parameter 3: season
            season,
            // Parameter 4: year
            parseFloat(year),
            // Parameter 5: area
            parseFloat(area),
        ]);

        if (!result || !Array.isArray(result.data) || result.data.length === 0) {
            throw new Error("Invalid response from the prediction server.");
        }
        
        // The prediction is in the first element of the 'data' array.
        // It also contains a markdown string, not just a number.
        const predictedYieldString = result.data[0];

        if (!predictedYieldString || typeof predictedYieldString !== 'string') {
             throw new Error("Prediction returned an unexpected value type.");
        }

        // We need to parse the number out of the Markdown string.
        const yieldMatch = predictedYieldString.match(/## ([\d.]+) Tons per Hectare/);
        if (!yieldMatch) {
            throw new Error("Could not parse yield from server response.");
        }

        return parseFloat(yieldMatch[1]);

    } catch (error) {
        console.error("Failed to get prediction from Hugging Face API:", error);
        throw error;
    }
}
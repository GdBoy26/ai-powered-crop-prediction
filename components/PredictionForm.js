import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { i18n } from '../data/i18n';
import { districts } from '../data/districts';
import { crops } from '../data/crops';
import Card from './Card';
import ChartCard from './ChartCard';
import { yieldData, soilData, weatherData } from '../data/mockData';

const PredictionForm = () => {
    const { theme, language } = useAppContext();
    const t = i18n[language];
    const [formData, setFormData] = useState({
        district: '',
        year: new Date().getFullYear(),
        season: '',
        crop: '',
        area: '',
        subPlots: [{ crop: '', area: '' }]
    });
    const [predictionResult, setPredictionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSubPlots, setShowSubPlots] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubPlotChange = (index, field, value) => {
        const updatedSubPlots = formData.subPlots.map((plot, i) =>
            i === index ? { ...plot, [field]: value } : plot
        );
        setFormData({ ...formData, subPlots: updatedSubPlots });
    };

    const addSubPlot = () => {
        setFormData({
            ...formData,
            subPlots: [...formData.subPlots, { crop: '', area: '' }]
        });
    };

    const removeSubPlot = (index) => {
        setFormData({
            ...formData,
            subPlots: formData.subPlots.filter((_, i) => i !== index)
        });
    };

    const handlePredict = async () => {
        setIsLoading(true);
        setPredictionResult(null);
        setError(null);

        const isFormValid = formData.district && formData.season &&
            (showSubPlots ? formData.subPlots.every(plot => plot.crop && plot.area) :
                (formData.crop && formData.area));

        if (!isFormValid) {
            setError("Please fill out all required fields.");
            setIsLoading(false);
            return;
        }

        try {
            // This is the key change: call your local API route.
            const response = await fetch('/api/predict-yield', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    district: formData.district,
                    crop: formData.crop,
                    season: formData.season,
                    year: formData.year,
                    area: formData.area
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong with the prediction.');
            }

            const data = await response.json();
            const predictedYield = data.predictedYield;

            if (predictedYield === undefined || isNaN(predictedYield)) {
                throw new Error("Prediction returned an invalid number. Please check the district and crop names and try again.");
            }

            setPredictionResult({
                predictedYield: parseFloat(predictedYield).toFixed(2),
                comparativePercentage: (Math.random() * 25 + 5).toFixed(1),
                totalArea: parseFloat(formData.area),
                advice: {
                    en: `Based on your ${formData.area} hectares in ${formData.district}, the predicted yield for ${formData.crop} is ${parseFloat(predictedYield).toFixed(2)} tons per hectare. This is an excellent result!`,
                },
                subPlotResults: [],
            });

        } catch (err) {
            console.error("Prediction API failed:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.district && formData.season &&
        (showSubPlots ? formData.subPlots.every(plot => plot.crop && plot.area) :
            (formData.crop && formData.area));

    return (
        <div className={`p-8 pt-20 ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gradient-to-br from-blue-50 to-green-50 text-gray-800'} min-h-screen transition-colors duration-300`}>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {t.predictionForm}
                </h1>
                <p className="text-lg text-center mb-8 opacity-75">Get AI-powered crop predictions and expert advice</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card title="🌾 Enter Farm Details" className="bg-white dark:bg-gray-800">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-2 font-medium">📍 {t.district}</label>
                                    <select name="district" value={formData.district} onChange={handleInputChange}
                                        className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 transition-colors duration-300">
                                        <option value="">Select district</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-2 font-medium">📅 {t.year}</label>
                                    <input type="number" name="year" value={formData.year} onChange={handleInputChange}
                                        className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 transition-colors duration-300" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-2 font-medium">🌤️ {t.season}</label>
                                    <select name="season" value={formData.season} onChange={handleInputChange}
                                        className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 transition-colors duration-300">
                                        <option value="">Select season</option>
                                        {Object.keys(crops).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {!showSubPlots && (
                                    <div className="flex flex-col">
                                        <label className="mb-2 font-medium">🌿 {t.crop}</label>
                                        <select name="crop" value={formData.crop} onChange={handleInputChange}
                                            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 transition-colors duration-300"
                                            disabled={!formData.season}>
                                            <option value="">Select crop</option>
                                            {formData.season && crops[formData.season].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={showSubPlots} onChange={(e) => setShowSubPlots(e.target.checked)}
                                        className="w-4 h-4 text-green-600" />
                                    <span className="font-medium">Divide field into multiple crops</span>
                                </label>
                            </div>
                            {!showSubPlots ? (
                                <div className="flex flex-col">
                                    <label className="mb-2 font-medium">📐 {t.area} (hectares)</label>
                                    <input type="number" name="area" value={formData.area} onChange={handleInputChange}
                                        className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 transition-colors duration-300"
                                        placeholder="Enter area in hectares" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="font-medium">🌾 Sub-plots Division</label>
                                    {formData.subPlots.map((plot, index) => (
                                        <div key={index} className="flex space-x-3 items-end">
                                            <div className="flex-1">
                                                <select value={plot.crop} onChange={(e) => handleSubPlotChange(index, 'crop', e.target.value)}
                                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                                                    <option value="">Select crop</option>
                                                    {formData.season && crops[formData.season].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <input type="number" value={plot.area} onChange={(e) => handleSubPlotChange(index, 'area', e.target.value)}
                                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                                    placeholder="Area (ha)" />
                                            </div>
                                            {formData.subPlots.length > 1 && (
                                                <button onClick={() => removeSubPlot(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    ❌
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={addSubPlot} className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1">
                                        <span>+</span>
                                        <span>Add another crop</span>
                                    </button>
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handlePredict}
                                disabled={!isFormValid || isLoading}
                                className="w-full mt-4 p-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Analyzing with AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🤖</span>
                                        <span>{t.getYield}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>
                    <div className="space-y-6">
                        {predictionResult && (
                            <>
                                <Card title="📈 Prediction Results" className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900">
                                    <div className="text-center space-y-4">
                                        <div className="flex items-baseline justify-center">
                                            <p className="text-5xl font-bold text-green-600">{predictionResult.predictedYield}</p>
                                            <p className="ml-2 text-xl font-bold">{t.yieldUnit}</p>
                                        </div>
                                        <p className="text-lg">
                                            📊 {t.comparativeYield}: <span className="text-green-600 font-bold">+{predictionResult.comparativePercentage}%</span> above average
                                        </p>
                                        <p className="text-sm opacity-75">Total Area: {predictionResult.totalArea} hectares</p>
                                        {predictionResult.subPlotResults.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold mb-2">Sub-plot Breakdown:</h4>
                                                {predictionResult.subPlotResults.map((result, index) => (
                                                    <div key={index} className="flex justify-between text-sm p-2 bg-white dark:bg-gray-700 rounded">
                                                        <span>{result.crop}</span>
                                                        <span>{result.yield} {t.yieldUnit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                <Card title="💡 AI-Powered Advice" className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900">
                                    <p className="text-sm leading-relaxed">
                                        {predictionResult.advice[language] || predictionResult.advice.en}
                                    </p>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">📊 Farm Analytics & Trends</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ChartCard title={t.predictedYield} data={yieldData} xAxisKey="name" yAxisKey="yield" color="#10b981" />
                        <ChartCard title={t.soilPH} data={soilData} xAxisKey="name" yAxisKey="pH" color="#8b5cf6" />
                        <ChartCard title={t.rainfallPatterns} data={weatherData} xAxisKey="name" yAxisKey="rainfall" color="#3b82f6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionForm;
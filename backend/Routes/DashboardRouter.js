import express from 'express';
import {
    getEnergyData,
    getTransactions,
    getUserEnergyPrice,
    updateUserEnergyPrice,
    ingestEnergyTelemetry,
    getLatestTelemetry,
    getTelemetryHistoryController,
    getSiteSummaryController,
    getSiteForecastController,
    getMarketplaceOpportunitiesController
} from '../Controllers/DashboardController.js';
import { authval } from '../Middlewares/Auth.js';

const router = express.Router();

router.post('/energy-ingest', ingestEnergyTelemetry);
router.get('/energy', getEnergyData);
router.get('/telemetry/latest', getLatestTelemetry);
router.get('/telemetry/history', getTelemetryHistoryController);
router.get('/transactions', getTransactions);
router.get('/site-summary', authval, getSiteSummaryController);
router.get('/site-forecast', authval, getSiteForecastController);
router.get('/marketplace-opportunities', authval, getMarketplaceOpportunitiesController);
router.get('/energy-price', authval, getUserEnergyPrice);
router.put('/energy-price', authval, updateUserEnergyPrice);

export default router;

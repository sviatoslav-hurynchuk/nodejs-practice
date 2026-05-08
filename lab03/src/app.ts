import express = require('express');
import cors = require('cors');
import cookieParser = require('cookie-parser');
import carRoutes from './routes/car';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import mongoose from "mongoose";

const app = express();

export const getHealthStatus = (readyState: number) => {
    if (readyState === 1) {
        return { statusCode: 200, body: { status: 'OK', database: 'connected' } };
    }

    return { statusCode: 503, body: { status: 'ERROR', database: 'disconnected' } };
};

app.get('/health', (req, res) => {
    const health = getHealthStatus(mongoose.connection.readyState);
    res.status(health.statusCode).json(health.body);
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/cars', carRoutes);

app.use(errorHandler);

export default app;
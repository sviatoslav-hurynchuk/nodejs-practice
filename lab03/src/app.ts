import express = require('express');
import cors = require('cors');
import carRoutes from './routes/car';
import { errorHandler } from './middleware/errorHandler';
import mongoose from "mongoose";

const app = express();

app.get('/health', (req, res) => {
    if (mongoose.connection.readyState === 1) { //connected
        res.status(200).json({ status: 'OK', database: 'connected' });
    } else {
        res.status(503).json({ status: 'ERROR', database: 'disconnected' }); //Service Unavailable
    }
});

app.use(cors());
app.use(express.json());


app.use('/cars', carRoutes);

app.use(errorHandler);

export default app;
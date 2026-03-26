import express = require('express');
import cors = require('cors');
import carRoutes from './routes/entity';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/cars', carRoutes);

app.use(errorHandler);

export default app;
import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Сервер запущено на порту ${PORT}`);
        });

        const shutdown = async () => {
            console.log('\nОтримано сигнал завершення роботи. Закриваємо з\'єднання...');

            server.close(async () => {
                console.log('HTTP сервер зупинено.');
                await mongoose.connection.close();
                console.log('MongoDB з\'єднання закрито.');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Не вдалося запустити додаток:', error);
        process.exit(1);
    }
};

startServer();
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Помилка:', err);

    
    if (err instanceof ZodError || err.name === 'ZodError') {
        
        const zodErrors = err.errors || err.issues || JSON.parse(err.message);

        return res.status(400).json({
            message: 'Помилка валідації даних',
            errors: zodErrors
        });
    }

    
    if (err instanceof mongoose.Error.CastError || err.name === 'CastError') {
        return res.status(400).json({
            message: `Невалідний формат ID. Передано: ${err.value}`
        });
    }

    
    if (err instanceof mongoose.Error.ValidationError || err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        return res.status(400).json({
            message: 'Помилка валідації бази даних',
            errors: messages
        });
    }

    
    if (err.code === 11000) {
        return res.status(409).json({
            message: 'Запис з такими унікальними даними вже існує'
        });
    }

    
    return res.status(500).json({
        message: 'Внутрішня помилка сервера'
    });
};
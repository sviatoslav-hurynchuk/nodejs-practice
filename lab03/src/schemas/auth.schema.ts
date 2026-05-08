import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Некоректний формат email'),
    password: z.string().min(6, 'Пароль має містити мінімум 6 символів')
});

export const loginSchema = z.object({
    email: z.string().email('Некоректний формат email'),
    password: z.string().min(1, 'Пароль обов\'язковий')
});
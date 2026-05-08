import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.email('Некоректний формат email'),
        password: z.string().min(6, 'Пароль має містити мінімум 6 символів')
    }),
});
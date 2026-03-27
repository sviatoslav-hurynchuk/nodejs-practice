import { z } from 'zod';

export const createCarSchema = z.object({
    model: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    year: z.number().int().min(1886).max(new Date().getFullYear() + 1),
    fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
    market: z.enum(['European', 'US', 'Asian']).default('European')
});

export const updateCarSchema = createCarSchema.partial();

export type CreateCarInput = z.infer<typeof createCarSchema>;

export type CarEntity = CreateCarInput & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
};
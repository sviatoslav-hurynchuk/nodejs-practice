import * as crypto from 'crypto';
import { CarEntity, CreateCarInput } from '../schemas/car.schema';

const carsStorage = new Map<string, CarEntity>();

export const getAllCars = (filters?: { fuelType?: string; year?: number; market?: string }): CarEntity[] => {
    let cars = Array.from(carsStorage.values());

    if (!filters || Object.keys(filters).length === 0) {
        return cars;
    }

    if (filters.fuelType) {
        cars = cars.filter(car => car.fuelType === filters.fuelType);
    }
    if (filters.year) {
        cars = cars.filter(car => car.year === Number(filters.year));
    }
    if (filters.market) {
        cars = cars.filter(car => car.market === filters.market);
    }

    return cars;
};

export const getCarById = (id: string): CarEntity | undefined => {
    return carsStorage.get(id);
};

export const createCar = (data: CreateCarInput): CarEntity => {
    const id = crypto.randomUUID();
    const now = new Date();

    const newCar: CarEntity = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
    };

    carsStorage.set(id, newCar);
    return newCar;
};

export const updateCar = (id: string, data: Partial<CreateCarInput>): CarEntity | null => {
    const existingCar = carsStorage.get(id);
    if (!existingCar) return null;

    const updatedCar: CarEntity = {
        ...existingCar,
        ...data,
        updatedAt: new Date(),
    };

    carsStorage.set(id, updatedCar);
    return updatedCar;
};

export const deleteCar = (id: string): boolean => {
    return carsStorage.delete(id);
};

export const resetCars = (): void => {
    carsStorage.clear();
};
import { CarModel } from '../src/models/car.model';
import {clearTestDB, closeTestDB, connectTestDB} from "./setup";
import { Types } from 'mongoose';

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Car Model Unit Tests', () => {
    it('1. повинен успішно створити валідний автомобіль та підставити дефолтні значення', async () => {
        const validCar = { model: 'Tesla Model S', year: 2023, fuelType: 'electric', ownerId: new Types.ObjectId() };
        const car = new CarModel(validCar);
        const savedCar = await car.save();

        expect(savedCar._id).toBeDefined();
        expect(savedCar.model).toBe(validCar.model);
        expect(savedCar.market).toBe('Other');
        expect(savedCar.createdAt).toBeDefined();
    });

    it('2. повинен викинути ValidationError, якщо рік невалідний (кастомна валідація)', async () => {
        const invalidCar = { model: 'Future Car', year: 3000, fuelType: 'hybrid', ownerId: new Types.ObjectId() };
        const car = new CarModel(invalidCar);

        let err: any;
        try {
            await car.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.name).toBe('ValidationError');
        expect(err.errors.year).toBeDefined();
    });

    it('3. повинен викинути помилку, якщо тип палива не з enum', async () => {
        const invalidCar = { model: 'Water Car', year: 2020, fuelType: 'water', ownerId: new Types.ObjectId() };
        const car = new CarModel(invalidCar);

        let err: any;
        try {
            await car.save();
        } catch (error) {
            err = error;
        }

        expect(err.errors.fuelType).toBeDefined();
    });

    it('4. повинен правильно обчислювати віртуальну властивість carAge', async () => {
        const currentYear = new Date().getFullYear();
        const carYear = 2015;
        const car = new CarModel({ model: 'Honda Civic', year: carYear, fuelType: 'petrol', ownerId: new Types.ObjectId() });

        expect(car.carAge).toBe(currentYear - carYear);
    });
});
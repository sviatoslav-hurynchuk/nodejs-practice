import request = require('supertest');
import mongoose from 'mongoose';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './setup';


beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());


const generateFakeId = () => new mongoose.Types.ObjectId().toHexString();

describe('Cars API Integration Tests', () => {

    describe('POST /cars', () => {
        it('1. should create a new car with valid data', async () => {
            const res = await request(app)
                .post('/cars')
                .send({
                    model: 'Toyota Camry',
                    year: 2022,
                    fuelType: 'petrol',
                    market: 'Asian'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id'); 
            expect(res.body.model).toBe('Toyota Camry');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('carAge'); 
        });

        it('2. should return 400 if validation fails', async () => {
            const res = await request(app)
                .post('/cars')
                .send({ year: 2022 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('3. should return 400 if year is out of bounds', async () => {
            const res = await request(app)
                .post('/cars')
                .send({ model: 'Ford T', year: 1500, fuelType: 'petrol' });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /cars', () => {
        it('4. should return an empty array if no cars exist', async () => {
            const res = await request(app).get('/cars');
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]); 
            expect(res.body.pagination).toBeDefined();
        });

        it('5. should return all created cars with pagination', async () => {
            await request(app).post('/cars').send({ model: 'Car A', year: 2020, fuelType: 'petrol' });
            await request(app).post('/cars').send({ model: 'Car B', year: 2021, fuelType: 'diesel' });

            const res = await request(app).get('/cars');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });

        it('6. should filter cars by ALL query parameters and combinations', async () => {
            await request(app).post('/cars').send({ model: 'Old US Car', year: 2000, fuelType: 'petrol', market: 'US' });
            await request(app).post('/cars').send({ model: 'New Euro EV', year: 2023, fuelType: 'electric', market: 'European' });
            await request(app).post('/cars').send({ model: 'New Asian Petrol', year: 2023, fuelType: 'petrol', market: 'Asian' });

            const resYear = await request(app).get('/cars?year=2023');
            expect(resYear.status).toBe(200);
            expect(resYear.body.data).toHaveLength(2);

            const resFuel = await request(app).get('/cars?fuelType=petrol');
            expect(resFuel.body.data).toHaveLength(2);

            const resMarket = await request(app).get('/cars?market=Asian');
            expect(resMarket.body.data).toHaveLength(1);
            expect(resMarket.body.data[0].model).toBe('New Asian Petrol');

            const resCombined = await request(app).get('/cars?year=2023&fuelType=electric&market=European');
            expect(resCombined.body.data).toHaveLength(1);
            expect(resCombined.body.data[0].model).toBe('New Euro EV');
        });

        it('16. should handle query with empty or irrelevant parameters', async () => {
            await request(app).post('/cars').send({ model: 'Car A', year: 2020, fuelType: 'petrol' });

            const res = await request(app).get('/cars?someRandomParam=true');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
        it('17. should sort cars by year in descending order', async () => {
            await request(app).post('/cars').send({ model: 'Old Car', year: 2000, fuelType: 'petrol' });
            await request(app).post('/cars').send({ model: 'New Car', year: 2023, fuelType: 'petrol' });

            const res = await request(app).get('/cars?sort=-year');
            expect(res.status).toBe(200);
            expect(res.body.data[0].model).toBe('New Car'); // Першою має бути нова машина
        });
    });

    describe('GET /cars/european (Special Route)', () => {
        it('7. should return only European market cars', async () => {
            await request(app).post('/cars').send({ model: 'BMW 3', year: 2020, fuelType: 'petrol', market: 'European' });
            await request(app).post('/cars').send({ model: 'Ford Mustang', year: 2021, fuelType: 'petrol', market: 'US' });

            const res = await request(app).get('/cars/european');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].model).toBe('BMW 3');
        });
    });

    describe('GET /cars/:id', () => {
        it('8. should return a car by ID', async () => {
            const createRes = await request(app).post('/cars').send({ model: 'Mazda 6', year: 2018, fuelType: 'petrol' });
            const carId = createRes.body.id;

            const getRes = await request(app).get(`/cars/${carId}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.id).toBe(carId);
        });

        it('9. should return 404 if car is not found (valid ID format but does not exist)', async () => {
            const res = await request(app).get(`/cars/${generateFakeId()}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Car not found');
        });

        it('17. should return 400 CastError if ID format is invalid', async () => {
            const res = await request(app).get('/cars/invalid-mongo-id');
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Невалідний формат ID');
        });
    });

    describe('PATCH /cars/:id', () => {
        it('10. should update a car successfully', async () => {
            const createRes = await request(app).post('/cars').send({ model: 'Honda Civic', year: 2015, fuelType: 'petrol' });
            const carId = createRes.body.id;

            const patchRes = await request(app)
                .patch(`/cars/${carId}`)
                .send({ year: 2016 });

            expect(patchRes.status).toBe(200);
            expect(patchRes.body.year).toBe(2016);
            expect(patchRes.body.model).toBe('Honda Civic');
        });

        it('11. should return 400 if update data is invalid', async () => {
            const createRes = await request(app).post('/cars').send({ model: 'Audi A4', year: 2020, fuelType: 'diesel' });

            const patchRes = await request(app)
                .patch(`/cars/${createRes.body.id}`)
                .send({ fuelType: 'water' });

            expect(patchRes.status).toBe(400);
        });

        it('12. should return 404 when trying to update non-existent car', async () => {
            const res = await request(app).patch(`/cars/${generateFakeId()}`).send({ model: 'Ghost Car' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /cars/:id', () => {
        it('13. should delete a car and return 204 status', async () => {
            const createRes = await request(app).post('/cars').send({ model: 'Nissan Leaf', year: 2019, fuelType: 'electric' });
            const carId = createRes.body.id;

            const deleteRes = await request(app).delete(`/cars/${carId}`);
            expect(deleteRes.status).toBe(204);

            const getRes = await request(app).get(`/cars/${carId}`);
            expect(getRes.status).toBe(404);
        });

        it('14. should return 404 when trying to delete non-existent car', async () => {
            const res = await request(app).delete(`/cars/${generateFakeId()}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Global Error Handler', () => {
        it('15. should handle generic server errors (500)', async () => {
            const res = await request(app)
                .post('/cars')
                .set('Content-Type', 'application/json')
                .send('{"bad": json');

            expect(res.status).toBe(500);
        });
    });

});
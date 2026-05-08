import request = require('supertest');
import mongoose from 'mongoose';
import jwt = require('jsonwebtoken');
import app, { getHealthStatus } from '../src/app';
import { errorHandler } from '../src/middleware/errorHandler';
import { generateAccessToken, verifyToken } from '../src/utils/tokens';
import { User } from '../src/models/user.model';
import { CarModel } from '../src/models/car.model';
import { getAllCars } from '../src/storage/car';
import { connectTestDB, closeTestDB, clearTestDB } from './setup';

beforeAll(async () => await connectTestDB());
afterEach(async () => {
    jest.restoreAllMocks();
    await clearTestDB();
});
afterAll(async () => await closeTestDB());

describe('Extra Coverage Tests', () => {
    it('covers health helper branches', () => {
        expect(getHealthStatus(1).statusCode).toBe(200);
        expect(getHealthStatus(0).statusCode).toBe(503);
    });

    it('covers /health route handler execution', async () => {
        const res = await request(app).get('/health');
        expect([200, 503]).toContain(res.status);
    });

    it('covers register catch branch', async () => {
        jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('db-fail'));
        const res = await request(app).post('/auth/register').send({
            email: 'catch_register@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(500);
    });

    it('covers login catch branch', async () => {
        jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('db-fail'));
        const res = await request(app).post('/auth/login').send({
            email: 'catch_login@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(500);
    });

    it('covers login branch when user is not found', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'missing_user@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(401);
    });

    it('covers refresh branch when token type is access', async () => {
        const token = generateAccessToken(new mongoose.Types.ObjectId().toHexString());
        const res = await request(app).post('/auth/refresh').set('Cookie', [`refresh_token=${token}`]);
        expect(res.status).toBe(401);
    });

    it('covers refresh catch branch with invalid token', async () => {
        const res = await request(app).post('/auth/refresh').set('Cookie', ['refresh_token=not_a_jwt']);
        expect(res.status).toBe(401);
    });

    it('covers requireAuth token-type mismatch and verify errors', async () => {
        const email = `owner_${Date.now()}@example.com`;
        const password = 'password123';
        await request(app).post('/auth/register').send({ email, password });

        const refreshToken = jwt.sign(
            { userId: new mongoose.Types.ObjectId().toHexString(), tokenType: 'refresh' },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );
        const wrongType = await request(app).post('/cars').set('Cookie', [`access_token=${refreshToken}`]).send({
            model: 'Wrong Token',
            year: 2020,
            fuelType: 'petrol'
        });
        expect(wrongType.status).toBe(401);

        const invalid = await request(app).post('/cars').set('Cookie', ['access_token=invalid']).send({
            model: 'Invalid Token',
            year: 2020,
            fuelType: 'petrol'
        });
        expect(invalid.status).toBe(401);
    });

    it('covers tokens util error branches', () => {
        const prevSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;
        expect(() => verifyToken('abc')).toThrow('JWT_SECRET is not configured');
        process.env.JWT_SECRET = prevSecret;

        const stringPayloadToken = jwt.sign('payload-string', process.env.JWT_SECRET!);
        expect(() => verifyToken(stringPayloadToken)).toThrow('Invalid token payload');
    });

    it('covers user pre-save branch when passwordHash not modified', async () => {
        const user = await User.create({ email: 'hook_user@example.com', passwordHash: 'password123' });
        const previousHash = user.passwordHash;
        user.email = 'hook_user_updated@example.com';
        await user.save();
        expect(user.passwordHash).toBe(previousHash);
    });

    it('covers errorHandler ValidationError and duplicate key branches', () => {
        const status = jest.fn().mockReturnThis();
        const json = jest.fn().mockReturnThis();
        const res = { status, json } as any;

        const validationErr = {
            name: 'ValidationError',
            errors: {
                field: { message: 'Bad field' }
            }
        };
        errorHandler(validationErr, {} as any, res, jest.fn());
        expect(status).toHaveBeenCalledWith(400);

        status.mockClear();
        json.mockClear();

        errorHandler({ code: 11000 }, {} as any, res, jest.fn());
        expect(status).toHaveBeenCalledWith(409);
    });

    it('covers errorHandler ZodError JSON.parse fallback', () => {
        const status = jest.fn().mockReturnThis();
        const json = jest.fn().mockReturnThis();
        const res = { status, json } as any;

        errorHandler({ name: 'ZodError', message: '[{"message":"from-json"}]' }, {} as any, res, jest.fn());
        expect(status).toHaveBeenCalledWith(400);
    });

    it('covers requireAuth path when cookies object is missing', () => {
        const status = jest.fn().mockReturnThis();
        const json = jest.fn().mockReturnThis();
        const req = {} as any;
        const res = { status, json } as any;
        const next = jest.fn();
        const { requireAuth } = require('../src/middleware/requireAuth');

        requireAuth(req, res, next);
        expect(status).toHaveBeenCalledWith(401);
    });

    it('covers storage sort ascending branch', async () => {
        const ownerId = new mongoose.Types.ObjectId();
        await CarModel.create({ model: 'AA', year: 2010, fuelType: 'petrol', ownerId });
        await CarModel.create({ model: 'BB', year: 2020, fuelType: 'diesel', ownerId });

        const result = await getAllCars({ sort: 'year' });
        expect(result.data[0].year).toBe(2010);
    });

    it('covers storage default query parameter branch', async () => {
        const result = await getAllCars();
        expect(result.pagination.page).toBe(1);
    });

    it('covers car route branches when update/delete returns null', async () => {
        const email = `branch_car_${Date.now()}@example.com`;
        const password = 'password123';
        await request(app).post('/auth/register').send({ email, password });

        const carModule = require('../src/storage/car');
        const ownerId = new mongoose.Types.ObjectId().toHexString();
        jest.spyOn(carModule, 'getCarById').mockResolvedValue({ ownerId, toString: () => ownerId } as any);
        jest.spyOn(carModule, 'updateCar').mockResolvedValue(null);
        jest.spyOn(carModule, 'deleteCar').mockResolvedValue(null);

        const token = generateAccessToken(ownerId);
        const updateRes = await request(app)
            .patch('/cars/507f1f77bcf86cd799439011')
            .set('Cookie', [`access_token=${token}`])
            .send({ model: 'updated' });
        expect(updateRes.status).toBe(404);

        const deleteRes = await request(app)
            .delete('/cars/507f1f77bcf86cd799439011')
            .set('Cookie', [`access_token=${token}`]);
        expect(deleteRes.status).toBe(404);
    });
});

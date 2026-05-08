import request = require('supertest');
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './setup';

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Auth API Integration Tests', () => {
    const asCookieArray = (header: string | string[] | undefined): string[] => {
        if (!header) {
            return [];
        }
        const items = Array.isArray(header) ? header : [header];
        return items.map((item) => item.split(';')[0]);
    };

    it('1. should register user and return 201 without password hash', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'new_user@example.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('new_user@example.com');
        expect(res.body.passwordHash).toBeUndefined();
    });

    it('2. should return 409 when email is duplicated', async () => {
        const payload = { email: 'dup_user@example.com', password: 'password123' };
        await request(app).post('/auth/register').send(payload);
        const res = await request(app).post('/auth/register').send(payload);

        expect(res.status).toBe(409);
    });

    it('3. should login and set access/refresh cookies', async () => {
        const payload = { email: 'login_user@example.com', password: 'password123' };
        await request(app).post('/auth/register').send(payload);

        const res = await request(app).post('/auth/login').send(payload);

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeDefined();
        const cookies = asCookieArray(res.headers['set-cookie']).join(';');
        expect(cookies).toContain('access_token=');
        expect(cookies).toContain('refresh_token=');
    });

    it('4. should return 401 on invalid login', async () => {
        await request(app).post('/auth/register').send({ email: 'user@example.com', password: 'password123' });
        const res = await request(app).post('/auth/login').send({ email: 'user@example.com', password: 'wrongpass' });

        expect(res.status).toBe(401);
    });

    it('5. should refresh tokens by refresh cookie', async () => {
        const payload = { email: 'refresh_user@example.com', password: 'password123' };
        await request(app).post('/auth/register').send(payload);
        const loginRes = await request(app).post('/auth/login').send(payload);
        const cookies = asCookieArray(loginRes.headers['set-cookie']);

        const refreshRes = await request(app)
            .post('/auth/refresh')
            .set('Cookie', cookies);

        expect(refreshRes.status).toBe(200);
        const refreshedCookies = asCookieArray(refreshRes.headers['set-cookie']).join(';');
        expect(refreshedCookies).toContain('access_token=');
        expect(refreshedCookies).toContain('refresh_token=');
    });

    it('6. should return 401 when refresh cookie is missing', async () => {
        const res = await request(app).post('/auth/refresh');
        expect(res.status).toBe(401);
    });

    it('7. should logout and clear cookies', async () => {
        const res = await request(app).post('/auth/logout');
        expect(res.status).toBe(200);
        const cookies = asCookieArray(res.headers['set-cookie']).join(';');
        expect(cookies).toContain('access_token=;');
        expect(cookies).toContain('refresh_token=');
    });
});

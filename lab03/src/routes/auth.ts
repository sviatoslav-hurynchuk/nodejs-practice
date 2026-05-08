import { Router, Request, Response, NextFunction } from 'express';
import bcrypt = require('bcryptjs');
import { User } from '../models/user.model';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/tokens';

const router = Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
};

const setAuthCookies = (res: Response, userId: string): void => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Користувач з таким email вже існує' });
            return;
        }

        const newUser = new User({
            email,
            passwordHash: password
        });

        await newUser.save();

        res.status(201).json({
            id: newUser._id,
            email: newUser.email,
            createdAt: newUser.createdAt
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        setAuthCookies(res, user.id);
        res.status(200).json({ message: 'Logged in' });
    } catch (error) {
        next(error);
    }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const payload = verifyToken(refreshToken);
        if (payload.tokenType !== 'refresh') {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        setAuthCookies(res, payload.userId);
        res.status(200).json({ message: 'Refreshed' });
    } catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    res.status(200).json({ message: 'Logged out' });
});

export default router;
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/tokens';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.access_token;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const payload = verifyToken(token);

        if (payload.tokenType !== 'access') {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

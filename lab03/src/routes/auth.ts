import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { validate } from '../middleware/validate';
import { registerSchema } from '../schemas/auth.schema';

const router = Router();

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

export default router;
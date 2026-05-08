import mongoose, { Document, Schema } from 'mongoose';
import bcrypt = require('bcryptjs');

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Унікальний індекс, щоб не було дублікатів
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash as string, salt);
});

export const User = mongoose.model<IUser>('User', UserSchema);
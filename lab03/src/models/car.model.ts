import { Schema, model, Types } from 'mongoose';

export interface ICar {
    model: string;
    year: number;
    fuelType: string;
    market?: string;
    ownerId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    carAge?: number;
}

const carSchema = new Schema<ICar>({
    model: {
        type: String,
        required: [true, 'Модель автомобіля є обов\'язковою'],
        trim: true,
        minlength: [2, 'Модель має містити мінімум 2 символи'],
        maxlength: [100, 'Модель має містити максимум 100 символів']
    },
    year: {
        type: Number,
        required: [true, 'Рік випуску є обов\'язковим'],
        validate: {
            validator: function(v: number) {
                const currentYear = new Date().getFullYear();
                return v >= 1886 && v <= currentYear + 1;
            },
            message: (props) => `Рік ${props.value} є невалідним. Рік має бути від 1886 до наступного року.`
        }
    },
    fuelType: {
        type: String,
        required: [true, 'Тип палива є обов\'язковим'],
        enum: {
            values: ['petrol', 'diesel', 'electric', 'hybrid'],
            message: '{VALUE} не є підтримуваним типом палива'
        }
    },
    market: {
        type: String,
        enum: {
            values: ['European', 'US', 'Asian', 'Other'],
            message: 'Невідомий ринок збуту'
        },
        default: 'Other'
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

carSchema.virtual('carAge').get(function() {
    const currentYear = new Date().getFullYear();
    return currentYear - this.year;
});

export const CarModel = model<ICar>('Car', carSchema);
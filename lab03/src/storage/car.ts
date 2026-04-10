import { CarModel } from '../models/car.model';
import { CreateCarInput } from '../schemas/car.schema';

interface QueryParams {
    fuelType?: string;
    year?: string;
    market?: string;
    sort?: string;
    page?: string;
    limit?: string;
}

export const getAllCars = async (queryParams: QueryParams = {}) => {
    const { fuelType, year, market, sort, page, limit } = queryParams;

    const filter: any = {};
    if (fuelType) filter.fuelType = fuelType;
    if (year) filter.year = Number(year);
    if (market) filter.market = market;

    let sortOption: any = { createdAt: -1 };
    if (sort) {
        const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
        const sortOrder = sort.startsWith('-') ? -1 : 1;
        sortOption = { [sortField]: sortOrder };
    }

    const pageNumber = parseInt(page || '1', 10);
    const limitNumber = parseInt(limit || '10', 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [data, totalCount] = await Promise.all([
        CarModel.find(filter).sort(sortOption).skip(skip).limit(limitNumber),
        CarModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    return {
        data,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: totalCount,
            pages: totalPages
        }
    };
};

export const getCarById = async (id: string) => {
    return CarModel.findById(id);
};

export const createCar = async (data: CreateCarInput) => {
    return CarModel.create(data);
};

export const updateCar = async (id: string, data: Partial<CreateCarInput>) => {
    return CarModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
};

export const deleteCar = async (id: string) => {
    return CarModel.findByIdAndDelete(id);
};
import { Router, Request, Response } from 'express';
import { createCar, deleteCar, getAllCars, getCarById, updateCar } from "../storage/car";
import { createCarSchema, updateCarSchema } from "../schemas/car.schema";
import { validate } from "../middleware/validate";

const router = Router();

router.get('/european', async (_req: Request, res: Response) => {
    const cars = await getAllCars({ market: 'European' });
    res.status(200).json(cars);
});

router.get('/', async (req: Request, res: Response) => {
    const cars = await getAllCars(req.query as any);
    res.status(200).json(cars);
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const car = await getCarById(req.params.id);
    if (!car) {
        return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(car);
});

router.post('/', validate(createCarSchema), async (req: Request, res: Response) => {
    const newCar = await createCar(req.body);
    res.status(201).json(newCar);
});

router.patch('/:id', validate(updateCarSchema), async (req: Request<{ id: string }>, res: Response) => {
    const updatedCar = await updateCar(req.params.id, req.body);
    if (!updatedCar) {
        return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(updatedCar);
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const isDeleted = await deleteCar(req.params.id);
    if (!isDeleted) {
        return res.status(404).json({ message: 'Car not found' });
    }
    res.status(204).send();
});

export default router;
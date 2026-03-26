import { Router, Request, Response } from 'express';
import {createCar, deleteCar, getAllCars, getCarById, updateCar} from "../storage/entity";
import {createCarSchema, updateCarSchema} from "../schemas/entity.schema";
import {validate} from "../middleware/validate";

const  router = Router();

router.get('/european', (_req: Request, res: Response) => {
    const cars = getAllCars({market: 'European'});
    res.status(200).json(cars);
});
router.get('/', (req: Request, res: Response) => {
    const cars = getAllCars(req.query);
    res.status(200).json(cars);
});

router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
    const car = getCarById(req.params.id);
    if(!car){
        return res.status(404).json({message: 'Car not found'});
    }
    res.status(200).json(car);
});


router.post('/', validate(createCarSchema), (req: Request, res: Response) => {
    const newCar = createCar(req.body);
    res.status(201).json(newCar); //201 created
});

router.patch('/:id', validate(updateCarSchema), (req: Request<{ id: string}>, res: Response) => {
    const updatedCar = updateCar(req.params.id, req.body);
    if(!updatedCar){
        return res.status(404).json({message: 'Car not found'});
    }
    res.status(200).json(updatedCar);
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
    const isDeleted = deleteCar(req.params.id);
    if (!isDeleted) {
        return res.status(404).json({message: 'Car not found'});
    }
    res.status(204).send(); //204 no content
});

export default router;
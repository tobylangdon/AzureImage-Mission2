import { Response, Request } from "express";
import cars from "../db/cars";

type data = {
    url: string;
    type: string;
    brand: string;
    color: string;
    relevantTags: string[];
};

export const checkImage = async (req: Request, res: Response<any>): Promise<void> => {
    const newCarData: data = req.body.data;
    try {
        const data = await cars.create(newCarData);
        console.log(data);
        res.status(200).send({ message: "Success" });
    } catch {
        res.status(400).send({ message: "Something went wrong" });
    }
};

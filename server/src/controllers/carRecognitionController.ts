import { Response, Request } from "express";
import cars from "../db/cars";

interface CheckImageResponse {
    type: string | undefined;
    brand: string | undefined;
    colours: string[];
    message: string;
    relevantTags: AzureTag[];
    urls: string[];
}
interface ErrorImageResponse {
    message: string;
}
type Cars = {
    _id: any;
    url: string;
    type: string;
    brand: string;
    color: string;
    relevantTags: string[];
};

type Brands = {
    name: string;
    confidence: number;
    rectangle: object;
};

type AzureTag = {
    name: string;
    confidence: number;
};

interface AzureResponse {
    brands: Brands[];
    metadata: object;
    modelVersion: string;
    requestId: string;
    tags: AzureTag[];
    color: object;
}

type CarTypes = {
    type: string;
    alternatives: string[];
};

const typicalCarColors: string[] = ["black", "white", "silver", "gray", "red", "blue", "green", "yellow", "orange", "brown"];

//Matches different relevant tags to certain types of cars
const carTypesToTags: CarTypes[] = [
    { type: "sedan", alternatives: ["sedan", "city car", "lexus"] },
    { type: "SUV", alternatives: ["compact sport utility vehicle", "sport utility vehicle"] },
    { type: "Hatchback", alternatives: ["hatchback", "subcompact car"] },
    { type: "Coupe", alternatives: ["supercar", "sports car", "convertible"] },
    { type: "Ute/Pick Up", alternatives: ["off-road vehicle", "pickup truck", "land rover"] },
    { type: "Minivan", alternatives: ["minivan", "executive car", "mini mpv"] },
    { type: "Super Car", alternatives: ["lamborghini", "maserati", "bugatti", "ferrari", "supercar"] },
];

const validateCar = (tags: AzureTag[]): boolean => {
    for (const tag of tags) {
        if (tag.name === "car") {
            return true;
        }
    }
    return false;
};

type ValidatedCarData = {
    type: string;
    colours: string[];
    tags: AzureTag[];
};

const mostLikelyType = (tags: AzureTag[]): ValidatedCarData => {
    let carTypeName: string | undefined = undefined;
    let carTypeCOnfidence: number = 0;

    let carTypes: AzureTag[] = [];
    let carProbability: Record<string, number> = {};

    let colours: string[] = [];
    //Checks tags against
    tags.forEach((tag) => {
        for (const type of carTypesToTags) {
            //Firstly finds the most relavant tag which has the highest confidence and stores that
            if ((type.alternatives.includes(tag.name) && !carTypeName) || tag.name === "minivan" || tag.name === "mini mpv" || tag.name === "hatchback") {
                carTypeName = type.type;
                carTypeCOnfidence = tag.confidence;
            }

            //stores all the relevant types in an object and relevant tags in an array
            if (tag.confidence > 0.84 && type.alternatives.includes(tag.name)) {
                carTypes.push(tag);
                !carProbability[type.type] ? (carProbability[type.type] = 1) : (carProbability[type.type] += 1);
            }
        }
        //check against possible colours
        if (typicalCarColors.includes(tag.name)) {
            colours.push(tag.name);
        }
    });

    //Function will check and validate types and return most likely result
    console.log(carProbability);
    const confirmedType = (): string => {
        //Firstly checks for likely hood of car image being a minivan

        if (carTypeName === "minivan" && carTypeCOnfidence > 0.95) {
            return "minivan";
        }
        //If not classified as minivan then perform other checks
        else {
            //creates some buffer variables
            let bufferType: string[] = [];
            let bufferConfidence: number = 0;

            for (const key in carProbability) {
                if (carProbability[key] > bufferConfidence) {
                    //if the iterated type of car was more likely will replace the current buffer
                    bufferType = [];
                    bufferType.push(key);
                    bufferConfidence = carProbability[key];
                }
                //If the found car types match then add to array to check later
                else if (carProbability[key] === bufferConfidence) {
                    bufferType.push(key);
                }
            }
            console.log(bufferType);
            //If array contains more than one car type perform more checks
            if (bufferType.length > 1) {
                let confirmedCar = carTypeName;
                if (bufferType.includes("Ute/Pick Up") && !bufferType.includes("hatchback")) {
                    confirmedCar = "Ute/Pick Up";
                } else {
                    carTypes.forEach((t) => {
                        if (t.name === "hatchback" || t.name === "subcompact car") {
                            confirmedCar = "hatchback";
                        }
                    });
                }

                return confirmedCar!;
            }
            return bufferType[0];
        }
    };

    return { type: confirmedType(), colours, tags: carTypes };
};

const getSimilarCarsFromDatabase = async (carData: ValidatedCarData): Promise<string[]> => {
    //destructure arg
    const { type, colours, tags } = carData;
    const tagsConfidenceRemoved: string[] = tags.map((tag) => tag.name);
    console.log("testing now", type);
    const carsWithType: Cars[] = await cars.find({ type: type.toLowerCase() });
    const carsWithTags: Cars[] = await cars.find({ relevantTags: { $in: tagsConfidenceRemoved } });
    console.log("TAGS: ", carsWithTags.length);

    function compare(a: Cars): number {
        console.log("comparing");
        const sameTags = a.relevantTags.map((tag) => {
            if (tagsConfidenceRemoved.includes(tag)) {
                return tag;
            }
        });
        if (a.color === colours[0]) {
            console.log(a.brand, a.color);
            return -1;
        }

        if (a.type === type) {
            return -3;
        }
        return 1;
    }
    const test = carsWithTags.sort(compare);
    const carsWithTypeUrl: string[] = test.map((car: Cars) => {
        return car.url;
    });
    return carsWithTypeUrl;
};

export const checkImage = async (req: Request, res: Response<CheckImageResponse | ErrorImageResponse>): Promise<void> => {
    try {
        var { data: azureRes, dataType } = req.body;

        const { brands, tags }: AzureResponse = azureRes;
        const isCar = validateCar(tags);
        console.log(tags, brands);
        if (!isCar) {
            res.status(400).send({ message: "The image is not a car" });
        } else {
            const type = mostLikelyType(tags);
            const urls = await getSimilarCarsFromDatabase(type);
            res.status(200).send({ type: type.type, colours: type.colours, brand: brands[0]?.name, message: "string", relevantTags: type.tags, urls });
        }
    } catch {
        res.status(500).send({ message: "An internal server error occured. Please try a different image" });
    }
};

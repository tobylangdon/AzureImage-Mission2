import { Response, Request } from "express";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import { spawn } from "child_process";

interface CheckImageResponse {
    type: string | undefined;
    brand: string | undefined;
    colours: string[];
    message: string;
}
interface ErrorImageResponse {
    message: string;
}

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
    { type: "sedan", alternatives: ["sedan", "city car"] },
    { type: "SUV", alternatives: ["compact sport utility vehicle", "sport utility vehicle"] },
    { type: "Hatchback", alternatives: ["hatchback", "subcompact car"] },
    { type: "Coupe", alternatives: ["supercar", "sports car", "convertible"] },
    { type: "Ute/Pick Up", alternatives: ["off-road vehicle", "pickup truck"] },
    { type: "Minivan", alternatives: ["minivan", "family car", "mini mpv"] },
    { type: "Super Car", alternatives: ["lamborghini", "maserati", "bugatti", "ferrari", "supercar"] },
];

const callAzureApiWithImageData = async (base64Image: string): Promise<AzureResponse | any> => {
    // Remove the data URL prefix and create a Buffer from base64 data

    // Use sharp to convert to JPEG
    const randNum: number = Math.random() * 1000;
    const imageSrc: string = `./TEMP_IMAGES/image${randNum.toString()}.jpg`;

    try {
        base64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const bufferData = Buffer.from(base64Image, "base64");
        // Convert to JPEG and save the image
        const outputBuffer = await sharp(bufferData).toFormat("jpeg").toBuffer();
        await fs.promises.writeFile(imageSrc, outputBuffer);

        console.log("Image saved as ", imageSrc);

        // Run Python script in order to send through bytes of image data to azure API
        const python = spawn("python", [`./getAzureImage.py`, imageSrc]);

        // Collect data from script
        let buf = "";
        for await (const data of python.stdout) {
            console.log("Pipe data from python script ...");
            buf += data;
        }

        //Turn the collected data into javascript json file
        var responseData = buf.toString().replace(/\'/g, '"');
        function replaceAll(string: string, search: string, replace: string) {
            return string.split(search).join(replace);
        }

        //Replace T with t and F with f as python booleans are capitalised
        responseData = replaceAll(responseData, "T", "t");
        responseData = replaceAll(responseData, "F", "f");
        const response: AzureResponse | any = JSON.parse(responseData);

        // Clean up: Remove the temporary image file
        await fs.promises.rm(imageSrc, { force: true });

        return response;
    } catch (error) {
        console.error(error);

        // Clean up: Remove the temporary image file
        await fs.promises.rm(imageSrc, { force: true });

        return error;
    }
};

const callAzureApiURL = async (url: string): Promise<AzureResponse | boolean> => {
    const KEY: string = "d780a27e3b2b4441bc4c940ac82a6223";

    return await axios
        .post(
            "https://car-recogniser.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Tags,Brands,Color",
            { url: url },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": KEY,
                },
            }
        )
        .then((res) => {
            return res.data;
        })
        .catch((error) => {
            console.error("Error: ", error.response);
            return false;
        });
};

const validateCar = (tags: AzureTag[]): boolean => {
    for (const tag of tags) {
        if (tag.name === "car") {
            return true;
        }
    }
    return false;
};

type TypeAndColour = {
    type: string;
    colours: string[];
};

const mostLikelyType = (tags: AzureTag[]): TypeAndColour => {
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
            if (tag.confidence > 0.85 && type.alternatives.includes(tag.name)) {
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
    console.log(carTypes);
    const confirmedType = (): string => {
        //Firstly checks for likely hood of car image being a minivan
        if (carTypeName === "minivan" && carTypeCOnfidence > 0.9) {
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

            //If array contains more than one car type perform more checks
            if (bufferType.length > 1) {
                let confirmedCar = carTypeName;
                carTypes.forEach((t) => {
                    if (t.name === "hatchback" || t.name === "subcompact car") {
                        confirmedCar = "hatchback";
                    }
                });
                return confirmedCar!;
            }
            return bufferType[0];
        }
    };

    return { type: confirmedType(), colours };
};

export const checkImage = async (req: Request, res: Response<CheckImageResponse | ErrorImageResponse>): Promise<void> => {
    try {
        var { url, isUrl } = req.body;

        //then calls the above functions which in turn calls the azure api endpoint checking the image
        //will either return an AzureResponse or be equal to false
        var azureRes: AzureResponse | any;
        if (!isUrl || url.includes("base64,/")) {
            azureRes = await callAzureApiWithImageData(url);
        } else {
            azureRes = await callAzureApiURL(url);
        }

        //if the api response works with no errors then validate data, otherwise send an error response back to client
        if (azureRes) {
            const { brands, tags }: AzureResponse = azureRes;
            const isCar = validateCar(tags);
            console.log(tags, brands);
            if (!isCar) {
                res.status(400).send({ message: "The image is not a car" });
            } else {
                const type = mostLikelyType(tags);
                res.status(200).send({ type: type.type, colours: type.colours, brand: brands[0]?.name, message: "string" });
            }
        } else {
            res.status(400).send({ message: "The image could not be used. Please try another image." });
        }
    } catch {
        res.status(500).send({ message: "An internal server error occured. Please try a different image" });
    }
};

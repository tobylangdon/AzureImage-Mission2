"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkImage = void 0;
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const typicalCarColors = ["black", "white", "silver", "gray", "red", "blue", "green", "yellow", "orange", "brown"];
//Matches different relevant tags to certain types of cars
const carTypesToTags = [
    { type: "sedan", alternatives: ["sedan", "city car"] },
    { type: "SUV", alternatives: ["compact sport utility vehicle", "sport utility vehicle"] },
    { type: "Hatchback", alternatives: ["hatchback", "subcompact car"] },
    { type: "Coupe", alternatives: ["supercar", "sports car", "convertible"] },
    { type: "Ute/Pick Up", alternatives: ["off-road vehicle", "pickup truck"] },
    { type: "Minivan", alternatives: ["minivan", "family car", "mini mpv"] },
    { type: "Super Car", alternatives: ["lamborghini", "maserati", "bugatti", "ferrari", "supercar"] },
];
const callAzureApiWithImageData = (base64Image) => __awaiter(void 0, void 0, void 0, function* () {
    // Remove the data URL prefix and create a Buffer from base64 data
    var _a, e_1, _b, _c;
    // Use sharp to convert to JPEG
    const randNum = Math.random() * 1000;
    const imageSrc = `./TEMP_IMAGES/image${randNum.toString()}.jpg`;
    try {
        base64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const bufferData = Buffer.from(base64Image, "base64");
        // Convert to JPEG and save the image
        const outputBuffer = yield (0, sharp_1.default)(bufferData).toFormat("jpeg").toBuffer();
        yield fs_1.default.promises.writeFile(imageSrc, outputBuffer);
        console.log("Image saved as ", imageSrc);
        // Run Python script in order to send through bytes of image data to azure API
        const python = (0, child_process_1.spawn)("python", [`./getAzureImage.py`, imageSrc]);
        // Collect data from script
        let buf = "";
        try {
            for (var _d = true, _e = __asyncValues(python.stdout), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const data = _c;
                console.log("Pipe data from python script ...");
                buf += data;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        //Turn the collected data into javascript json file
        var responseData = buf.toString().replace(/\'/g, '"');
        function replaceAll(string, search, replace) {
            return string.split(search).join(replace);
        }
        //Replace T with t and F with f as python booleans are capitalised
        responseData = replaceAll(responseData, "T", "t");
        responseData = replaceAll(responseData, "F", "f");
        const response = JSON.parse(responseData);
        // Clean up: Remove the temporary image file
        yield fs_1.default.promises.rm(imageSrc, { force: true });
        return response;
    }
    catch (error) {
        console.error(error);
        // Clean up: Remove the temporary image file
        yield fs_1.default.promises.rm(imageSrc, { force: true });
        return error;
    }
});
const callAzureApiURL = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const KEY = "d780a27e3b2b4441bc4c940ac82a6223";
    return yield axios_1.default
        .post("https://car-recogniser.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Tags,Brands,Color", { url: url }, {
        headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": KEY,
        },
    })
        .then((res) => {
        return res.data;
    })
        .catch((error) => {
        console.error("Error: ", error.response);
        return false;
    });
});
const validateCar = (tags) => {
    for (const tag of tags) {
        if (tag.name === "car") {
            return true;
        }
    }
    return false;
};
const mostLikelyType = (tags) => {
    let carTypeName = undefined;
    let carTypeCOnfidence = 0;
    let carTypes = [];
    let carProbability = {};
    let colours = [];
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
    const confirmedType = () => {
        //Firstly checks for likely hood of car image being a minivan
        if (carTypeName === "minivan" && carTypeCOnfidence > 0.9) {
            return "minivan";
        }
        //If not classified as minivan then perform other checks
        else {
            //creates some buffer variables
            let bufferType = [];
            let bufferConfidence = 0;
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
                return confirmedCar;
            }
            return bufferType[0];
        }
    };
    return { type: confirmedType(), colours };
};
const checkImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        var { url, isUrl } = req.body;
        //then calls the above functions which in turn calls the azure api endpoint checking the image
        //will either return an AzureResponse or be equal to false
        var azureRes;
        if (!isUrl || url.includes("base64,/")) {
            azureRes = yield callAzureApiWithImageData(url);
        }
        else {
            azureRes = yield callAzureApiURL(url);
        }
        //if the api response works with no errors then validate data, otherwise send an error response back to client
        if (azureRes) {
            const { brands, tags } = azureRes;
            const isCar = validateCar(tags);
            console.log(tags, brands);
            if (!isCar) {
                res.status(400).send({ message: "The image is not a car" });
            }
            else {
                const type = mostLikelyType(tags);
                res.status(200).send({ type: type.type, colours: type.colours, brand: (_g = brands[0]) === null || _g === void 0 ? void 0 : _g.name, message: "string" });
            }
        }
        else {
            res.status(400).send({ message: "The image could not be used. Please try another image." });
        }
    }
    catch (_h) {
        res.status(500).send({ message: "An internal server error occured. Please try a different image" });
    }
});
exports.checkImage = checkImage;

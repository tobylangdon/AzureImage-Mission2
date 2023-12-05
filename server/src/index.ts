import express, { Express, Request, Response } from "express";
import cors from "cors";
import car from "./routes/carRecognition";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "../../.env" });
import cars from "./db/cars";
import uploadCar from "./routes/uploadcar";
import mongoose, { Schema, Document, connect } from "mongoose";
import { MongoClient } from "mongodb";

const app: Express = express();

const port: number | string = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);
//dummy root route to test azure is working
app.get("/", (req: Request, res: Response) => {
    res.send("Hello world - the server is working!");
});
app.use(car);
app.use(uploadCar);

//sets up database connection
main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/TurnersCars");
    console.log("connected to mongo database");
}

app.listen(port, () => {
    console.log("Listening on port", port);
});

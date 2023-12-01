import express, { Express, Request, Response } from "express";
import cors from "cors";
import car from "./routes/carRecognition";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoClient, ServerApiVersion } from "mongodb";
dotenv.config({ path: __dirname + "../../.env" });

// const uri: string = "mongodb+srv://mission2:securepassword@missionready.wqeqhsu.mongodb.net/?retryWrites=true&w=majority";

const app: Express = express();

app.use(express.json({ limit: "50mb" }));
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);
app.use(car);

app.listen(5000, () => {
    console.log("Listening on port 5000");
});

// mongoose.Promise = Promise;
// mongoose
//     .connect(uri)
//     .then(() => console.log("connected to mongo"))
//     .catch((err: Error) => console.log("error"));

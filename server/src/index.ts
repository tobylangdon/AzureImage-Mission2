import express, { Express, Request, Response } from "express";
import cors from "cors";
import car from "./routes/carRecognition";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "../../.env" });

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

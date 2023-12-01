import mongoose, { Schema, Document } from "mongoose";

interface Car extends Document {
    image: String;
    brand: String;
    color: String;
    type: String;
}

const CarsSchema: Schema<Car> = new Schema({
    image: { type: Image, required: true },
    brand: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: true },
});

const CarModel = mongoose.model<Car>("Car", CarsSchema);

export default CarModel;

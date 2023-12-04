import mongoose, { Schema, Document, connect } from "mongoose";

const carSchema = new mongoose.Schema({
    url: String,
    type: String,
    brand: String,
    color: String,
    relevantTags: Array,
});

export = mongoose.model("cars", carSchema);

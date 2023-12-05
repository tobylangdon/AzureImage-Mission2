import { FormEvent, useState } from "react";
import styles from "./AddCar.module.css";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_ENDPOINT = import.meta.env.VITE_API;

type data = {
    url: string;
    type: string;
    brand: string;
    color: string;
    relevantTags: string[];
};

export default function AddCar() {
    const navigate = useNavigate();
    const [type, setType] = useState<string>("");
    const [color, setColor] = useState<string>("");
    const [brand, setBrand] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [relevantTags, setRelevantTags] = useState<string[]>([]);
    const [imgErr, setImgErr] = useState<boolean>();
    const [dataSubmitted, setDataSubmitted] = useState<boolean>(false);

    const handleRelevantTagsChange = (stringToSeperate: string) => {
        var arrayOfTags: string[] = stringToSeperate.split(",");
        arrayOfTags = arrayOfTags.map((str) => str.trim().toLowerCase());
        setRelevantTags(arrayOfTags);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (imgErr) return;
        if (type === "suv") setType("SUV");
        if (type !== "SUV") {
            setType(type.toLowerCase());
        }
        const dataToSend: data = {
            url: url,
            type: type,
            brand: brand.toLowerCase(),
            color: color.toLowerCase(),
            relevantTags: relevantTags,
        };

        axios
            .post(
                `${API_ENDPOINT}/api/car-upload`,
                { data: dataToSend },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
            .then((response) => {
                console.log(response.data);
                if (response.status === 200) {
                    setDataSubmitted(true);
                }
            })
            .catch((error) => {
                console.error("Error:", error.response.data.error);
            });
    };
    const checkErr = (): string => {
        if (url === "") {
            return "";
        }
        return "Image error";
    };

    return (
        <div className={styles.container}>
            {!dataSubmitted ? (
                <>
                    <form className={styles.addCarForm} onSubmit={submit}>
                        <TextField
                            label="Type"
                            variant="outlined"
                            required
                            onChange={(e) => setType(e.target.value)}
                            sx={{
                                width: "90%",
                                margin: "20px",
                            }}
                        />
                        <TextField
                            label="Brand"
                            variant="outlined"
                            required
                            onChange={(e) => setBrand(e.target.value)}
                            sx={{
                                width: "90%",
                                margin: "20px",
                            }}
                        />
                        <TextField
                            label="Colour"
                            variant="outlined"
                            required
                            onChange={(e) => setColor(e.target.value)}
                            sx={{
                                width: "90%",
                                margin: "20px",
                            }}
                        />
                        <TextField
                            label="Relevant Tags - (seperate by comma)"
                            variant="outlined"
                            required
                            onChange={(e) => handleRelevantTagsChange(e.target.value)}
                            sx={{
                                width: "90%",
                                margin: "20px",
                            }}
                        />
                        <TextField
                            label="URL to car image"
                            variant="outlined"
                            required
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setImgErr(false);
                            }}
                            sx={{
                                width: "90%",
                                margin: "20px",
                            }}
                        />
                        <Button type="submit" variant="outlined">
                            Upload Car To Database
                        </Button>
                    </form>
                    {!imgErr ? <img src={url} alt="image preview" onError={() => setImgErr(true)} /> : <p>{checkErr()}</p>}
                </>
            ) : (
                <>
                    <h2>Your data has been uploaded</h2>
                    <Button onClick={() => navigate("/admin")}>Upload another car?</Button>
                </>
            )}
        </div>
    );
}

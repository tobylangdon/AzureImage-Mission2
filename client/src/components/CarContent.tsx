import styles from "./CarContent.module.css";
import { FormEvent, useState } from "react";
import Button from "@mui/material/Button";
import axios from "axios";

interface AzureResponse {
    brands: Brands[];
    metadata: object;
    modelVersion: string;
    requestId: string;
    tags: AzureTag[];
    color: object;
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

const API_ENDPOINT = import.meta.env.VITE_API;
const KEY: string = import.meta.env.VITE_AZURE_KEY;
const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_ENDPOINT;

export default function CarContent() {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [localImages, setLocalImages] = useState<FileList>();

    const [showError, setShowError] = useState<boolean>(false);
    const [showImg, setShowImg] = useState<boolean>(false);
    const [fetchingData, setFetchingData] = useState<boolean>(false);

    const [carImageData, setCarImageData] = useState<CheckImageResponse | undefined>();
    const [carImageError, setCarImageError] = useState<ErrorImageResponse | undefined>();
    const [isUrl, setIsUrl] = useState<boolean>(true);
    const [similarCarUrls, setSimilarCarUrls] = useState<string[]>();

    // useEffect(() => {
    //     if (azureResponse) {
    //         console.log(azureResponse);
    //     }
    // }, [azureResponse]);

    const changeBetweenUploads = (_isUrl: boolean) => {
        setIsUrl(_isUrl);
        setCarImageError(undefined);
        setShowImg(true);
        setShowError(false);
    };

    const submitToAzure = (e: FormEvent, _isUrl: boolean) => {
        e.preventDefault();
        setFetchingData(true);
        setCarImageError(undefined);
        setCarImageData(undefined);
        if (showError) {
            return;
        }
        const dataType: string = _isUrl ? "json" : "octet-stream";

        axios
            .post(`${AZURE_ENDPOINT}`, _isUrl ? { url: imageUrl } : localImages && localImages[0], {
                headers: {
                    "Content-Type": "application/" + dataType,
                    "Ocp-Apim-Subscription-Key": KEY,
                },
            })
            .then((res) => {
                console.log(res.data);
                sendDataToServer(res.data, dataType);
            })
            .catch((error) => {
                console.error("Error: ", error.response);
                setFetchingData(false);
                if (error.response.status === 400) {
                    setCarImageError({ message: "The image could not be used. Please try another image." });
                } else {
                    setCarImageError({ message: "An unexpected error occured..." });
                }
            });
    };

    const sendDataToServer = (data: AzureResponse, dataType: string) => {
        axios
            .post(
                `${API_ENDPOINT}/api/car-recognition`,
                { data, dataType },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
            .then((response) => {
                setFetchingData(false);
                console.log(response.data);
                setCarImageData(response.data);
                setSimilarCarUrls(response.data.urls);
            })
            .catch((error) => {
                console.error("Error:", error.response.data.error);
                setFetchingData(false);
                setCarImageError(error.response.data);
            });
    };

    return (
        <div className={styles.container}>
            <form className={styles.form} onSubmit={(e) => submitToAzure(e, isUrl)}>
                {isUrl ? (
                    <>
                        <input
                            value={imageUrl}
                            type="text"
                            placeholder="Enter image url"
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                setShowError(false);
                                setShowImg(true);
                            }}
                        ></input>
                        <Button type="submit" variant="contained" color="success">
                            Check
                        </Button>
                    </>
                ) : (
                    <div className={styles.dragDropContainer}>
                        {localImages ? (
                            <>
                                <Button
                                    onClick={() => {
                                        setLocalImages(undefined);
                                        setShowError(false);
                                        setShowImg(false);
                                    }}
                                    variant="contained"
                                    color="inherit"
                                    style={{ color: "black" }}
                                >
                                    Upload a different image
                                </Button>
                                <Button type="submit" variant="contained" color="success">
                                    Check
                                </Button>
                            </>
                        ) : (
                            <input
                                type="file"
                                name="file"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setLocalImages(e.target.files);
                                        setShowImg(true);
                                    }
                                }}
                            />
                        )}
                    </div>
                )}

                <div className={styles.optionsContainer}>
                    <Button variant="contained" onClick={() => changeBetweenUploads(true)}>
                        URL
                    </Button>
                    <Button variant="contained" onClick={() => changeBetweenUploads(false)} className={styles.nonActive}>
                        Local Image
                    </Button>
                </div>

                <div className={styles.previewContainer}>
                    {showImg && (
                        <img
                            className={styles.previewImg}
                            src={!isUrl ? localImages && URL.createObjectURL(localImages[0]) : imageUrl}
                            width="200px"
                            onError={() => {
                                console.log("errir with image");
                                if ((!isUrl && localImages) || (isUrl && imageUrl !== undefined && imageUrl !== "")) {
                                    setShowError(true);
                                }

                                setShowImg(false);
                            }}
                        />
                    )}
                    {showError && <p>Please enter valid Image</p>}
                </div>
            </form>

            {fetchingData && (
                <>
                    <img src="images/loading.svg" width="70px" alt="loading" />
                </>
            )}
            {carImageData && (
                <>
                    {carImageData.type && (
                        <>
                            <h2>Car Type: </h2>
                            <p>{carImageData?.type}</p>
                        </>
                    )}

                    {carImageData.brand && (
                        <>
                            <h2>Car brand: </h2>
                            <p>{carImageData?.brand}</p>
                        </>
                    )}
                    {carImageData.colours.length > 0 && (
                        <>
                            <h2>Car colour: </h2>
                            <p>{carImageData.colours.map((colour) => colour)}</p>
                        </>
                    )}
                    <div className={styles.databaseImages}>
                        {similarCarUrls &&
                            similarCarUrls.map((image) => {
                                return <img src={image} width="200px" />;
                            })}
                    </div>

                    {!carImageData.type && !carImageData.brand && !carImageData.colours && <p>We could not determine what this car may be with certainty</p>}
                </>
            )}
            {carImageError && <p>{carImageError.message}</p>}
        </div>
    );
}

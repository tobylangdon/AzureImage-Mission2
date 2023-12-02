import styles from "./CarContent.module.css";
import { FormEvent, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import axios from "axios";
import DragDrop from "./DragDrop";

interface CheckImageResponse {
  type: string | undefined;
  brand: string | undefined;
  colours: string[];
  message: string;
}
interface ErrorImageResponse {
  message: string;
}

export default function CarContent() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [base64Data, setBase64Data] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [showImg, setShowImg] = useState<boolean>(false);
  const [carImageData, setCarImageData] = useState<
    CheckImageResponse | undefined
  >();
  const [carImageError, setCarImageError] = useState<
    ErrorImageResponse | undefined
  >();
  const [isLocal, setIsLocal] = useState<boolean>(false);

  const [files, setFiles] = useState<File[]>();

  useEffect(() => {
    if (files) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Data(reader.result?.toString()!);
          setShowImg(true);
          console.log(reader.result);
        };
        // You might want to update this function , I got an error on my end. error :  "Optional chain expressions can return undefined by design - using a non-null assertion is unsafe and wrong."
        // reader.onloadend = () => {
        //     if (reader.result) {
        //         setBase64Data(reader.result.toString());
        //         setShowImg(true);
        //         console.log(reader.result);
        //     } else {
        //         console.error("reader.result was null or undefined.");
        //     }
        // };
        reader.onerror = () => {
          console.error("There was an issue reading the file.");
        };
        reader.readAsDataURL(file);
        console.log(reader);
        return reader;
      });
    }
  }, [files]);

  const changeBetweenUploads = () => {
    setIsLocal(!isLocal);
    setShowError(false);
  };

  const submit = (e: FormEvent, isUrl: boolean) => {
    e.preventDefault();
    setCarImageError(undefined);
    setCarImageData(undefined);
    if (showError) {
      return;
    }
    axios
      .post(
        // You might want to use constant variable to set in your .env for ease of use when deploying and you need to change the endpoint
        "http://localhost:5000/api/car-recognition",
        { url: isUrl ? imageUrl : base64Data, isUrl },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        // const tags = response.data.tagsResult.values;
        // console.log(tags);
        console.log(response.data);
        setCarImageData(response.data);
      })
      .catch((error) => {
        console.error("Error:", error.response.data.error);
        setCarImageError(error.response.data);
      });
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={(e) => submit(e, !isLocal)}>
        {!isLocal ? (
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
            <Button type="submit" variant="contained">
              Check
            </Button>
          </>
        ) : (
          <div className={styles.dragDropContainer}>
            <DragDrop file={files} setFile={setFiles}></DragDrop>
            <Button type="submit" variant="contained">
              Check
            </Button>
          </div>
        )}

        <div className={styles.optionsContainer}>
          <Button variant="contained" onClick={() => changeBetweenUploads()}>
            URL
          </Button>
          <Button
            variant="contained"
            onClick={() => changeBetweenUploads()}
            className={styles.nonActive}
          >
            Local Image
          </Button>
        </div>

        <div className={styles.previewContainer}>
          {showImg && (
            <img
              className={styles.previewImg}
              src={isLocal ? base64Data : imageUrl}
              width="200px"
              onError={() => {
                console.log("errir with image");
                setShowError(true);
                setShowImg(false);
              }}
            />
          )}
          {showError && <p>Please enter valid URL</p>}
        </div>
      </form>
      {carImageData && (
        <>
          <h2>Car Type: </h2>
          <p>{carImageData?.type}</p>
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
        </>
      )}
      {carImageError && <p>{carImageError.message}</p>}
    </div>
  );
}

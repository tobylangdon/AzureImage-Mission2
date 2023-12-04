import styles from "./CarDisplay.module.css";
import Button from "@mui/material/Button";

type Props = {
    src: string;
    type: string;
    brand: string | undefined;
    // price: string | undefined;
    // enquireId: string | undefined;
};

export default function CarDisplay(props: Props) {
    return (
        <div className={styles.carDisplayBox}>
            <img src={props.src} alt="car image" />
            <div className={styles.carInfoBox}>
                <div>
                    <p>
                        Type: <span className={styles.data}>{props.type}</span>
                    </p>
                    <p>
                        Brand: <span className={styles.data}>{props.brand}</span>
                    </p>
                    <p>
                        Price: <span className={styles.data}>{"$21000"}</span>
                    </p>
                    <Button variant="contained">Enquire</Button>
                </div>
            </div>
        </div>
    );
}

import styles from "./Navbar.module.css";
import { NavLink } from "react-router-dom";

export default function NavBar() {
    return (
        <div className={styles.header}>
            <h1>Turner's Cars</h1>
            <div className={styles.links}>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/admin">Add A Car</NavLink>
            </div>
        </div>
    );
}

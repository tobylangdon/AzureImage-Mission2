import styles from "./Navbar.module.css";

export default function NavBar() {
    return (
        <div className={styles.header}>
            <h1>Turner's Cars</h1>
            <div className={styles.links}>
                <a>Home</a>
                <a>About</a>
                <a>Auction</a>
            </div>
        </div>
    );
}

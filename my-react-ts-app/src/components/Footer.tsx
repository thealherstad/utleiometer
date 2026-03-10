import type { JSX } from "react";
import "../style/footer.css";

export default function Footer(): JSX.Element {
    return (
        <footer className="footer">
            <div className="footer_inner">
                <p>&copy; 2026 Utleiometer</p>
                <p>Kontakt: info@utleiometer.no</p>
                <p>Utviklere:</p>
                <p>Vilde Erdal Kørner, Thea Lien Herstad, Jan Zabileski, Sawaymaan Singh og Felix Jenssen</p>
            </div>
        </footer>
    );
}
import type { JSX, ReactNode } from "react";
import Footer from "./Footer";
import "../style/Layout.css";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps): JSX.Element {
    return (
        <div className="layout">
            <main className="layout__main">{children}</main>
            <Footer />
        </div>
    );
}
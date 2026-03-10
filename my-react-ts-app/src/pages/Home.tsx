
import "../style/home.css";
import Layout from "../components/Layout";
import type { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <Layout>
      <section className="hero">
        <div className="hero__inner">
          <h1>Velkommen til Utleiometer</h1>
          <p>Del erfaringer og få et bedre bilde av leiemarkedet for studenter</p>
        </div>
      </section>

      <section className="map-section">
        <h2>Utforsk boliger på kartet</h2>

        <div className="map-placeholder">
          Kart kommer her
        </div>
      </section>
    </Layout>
  );
}
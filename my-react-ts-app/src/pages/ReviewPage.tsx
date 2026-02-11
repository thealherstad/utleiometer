import { useParams } from "react-router-dom";
import "../style/ReviewPage.css";

export default function ReviewPage() {
  const { id } = useParams();

  return (
    <div className="review-page">
      <header className="review-header">
        <h1>Skriv anmeldelse</h1>
        <p>Bolig ID: {id}</p>
      </header>

      <form className="review-form" onSubmit={(e) => e.preventDefault()}>
        <section className="review-section">
          <h2>Plassering</h2>
          <label>
            Poeng (1-5)
            <select name="placementScore" defaultValue="">
              <option value="" disabled>
                Velg poeng
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          <label>
            Kommentar
            <textarea name="placementNote" rows={3} placeholder="Kort kommentar om plassering..." />
          </label>
        </section>

        <section className="review-section">
          <h2>Pris</h2>
          <label>
            Poeng (1-5)
            <select name="priceScore" defaultValue="">
              <option value="" disabled>
                Velg poeng
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          <label>
            Kommentar
            <textarea name="priceNote" rows={3} placeholder="Kort kommentar om pris..." />
          </label>
        </section>

        <section className="review-section">
          <h2>Kostnader</h2>
          <label>
            Poeng (1-5)
            <select name="costScore" defaultValue="">
              <option value="" disabled>
                Velg poeng
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          <label>
            Kommentar
            <textarea name="costNote" rows={3} placeholder="Kort kommentar om kostnader..." />
          </label>
        </section>

        <section className="review-section">
          <h2>Generelt</h2>
          <label>
            Poeng (1-5)
            <select name="overallScore" defaultValue="">
              <option value="" disabled>
                Velg poeng
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          <label>
            Kommentar
            <textarea name="overallNote" rows={3} placeholder="Kort kommentar om helheten..." />
          </label>
        </section>

        <div className="review-actions">
          <button type="submit">Send inn</button>
        </div>
      </form>
    </div>
  );
}

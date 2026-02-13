import { useParams } from "react-router-dom";
import "../style/ReviewPage.css";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

export default function ReviewPage() {
  const { id } = useParams();
  
  const [review, setReview] = useState({
    placementScore: "",
    placementNote: "",
    priceScore: "",
    priceNote: "",
    costScore: "",
    costNote: "",
    overallScore: "",
    overallNote: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setReview((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Du må være innlogget");
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        housingId: id,
        userId: user.uid,
        placementScore: Number(review.placementScore),
        placementNote: review.placementNote,
        priceScore: Number(review.priceScore),
        priceNote: review.priceNote,
        costScore: Number(review.costScore),
        costNote: review.costNote,
        overallScore: Number(review.overallScore),
        overallNote: review.overallNote,
        createdAt: serverTimestamp(),
      });

      alert("Anmeldelse sendt")
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      alert(error.message);
    }
  };

  return (
    <div className="review-page">
      <header className="review-header">
        <h1>Skriv anmeldelse</h1>
        <p>Bolig ID: {id}</p>
      </header>

      <form className="review-form" onSubmit={handleSubmit}>
        <section className="review-section">
          <h2>Plassering</h2>
          <label>
            Poeng (1-5)
            <select 
              name="placementScore"
              value={review.placementScore}
              onChange={handleChange}
            >
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
            <textarea 
              name="placementNote"
              value={review.placementNote}
              onChange={handleChange}
              rows={3}
              placeholder="Kort kommentar om plassering..." 
            />
          </label>
        </section>

        <section className="review-section">
          <h2>Pris</h2>
          <label>
            Poeng (1-5)
            <select 
              name="priceScore"
              value={review.priceScore}
              onChange={handleChange}
            >
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
            <textarea
              name="priceNote"
              value={review.priceNote}
              onChange={handleChange}
              rows={3}
              placeholder="Kort kommentar om pris..." 
            />
          </label>
        </section>

        <section className="review-section">
          <h2>Kostnader</h2>
          <label>
            Poeng (1-5)
            <select 
              name="costScore"
              value={review.costScore}
              onChange={handleChange}
            >
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
            <textarea
              name="costNote"
              value={review.costNote}
              onChange={handleChange}
              rows={3} 
              placeholder="Kort kommentar om kostnader..." 
            />
          </label>
        </section>

        <section className="review-section">
          <h2>Generelt</h2>
          <label>
            Poeng (1-5)
            <select 
              name="overallScore"
              value={review.overallScore}
              onChange={handleChange}
            >
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
            <textarea
              name="overallNote"
              value={review.overallNote}
              onChange={handleChange}
              rows={3}
              placeholder="Kort kommentar om helheten..." 
            />
          </label>
        </section>

        <div className="review-actions">
          <button type="submit">Send inn</button>
        </div>
      </form>
    </div>
  );
}

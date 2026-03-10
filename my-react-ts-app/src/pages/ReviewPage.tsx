import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

import "../style/ReviewPage.css";
import { auth, db } from "../firebase";
import Layout from "../components/Layout";

type ReviewFormState = {
  placementScore: string;
  placementNote: string;
  priceScore: string;
  priceNote: string;
  costScore: string;
  costNote: string;
  overallScore: string;
  overallNote: string;
};

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState<ReviewFormState>({
    placementScore: "",
    placementNote: "",
    priceScore: "",
    priceNote: "",
    costScore: "",
    costNote: "",
    overallScore: "",
    overallNote: "",
  });
  const [housingAddress, setHousingAddress] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function handleChange(e: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setReview((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const user = auth.currentUser;

    if (!id) {
      setSubmitError("Fant ikke boligen du prøver å anmelde.");
      return;
    }

    if (!user) {
      setSubmitError("Du må være innlogget for å sende inn en anmeldelse.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const fallbackName = user.email?.split("@")[0] || "Bruker";
      const submittedByName = user.displayName || fallbackName;

      await addDoc(collection(db, "reviews"), {
        housingId: id,
        housingAddress,
        userId: user.uid,
        submittedByName,
        isAnonymous,
        likes: [],
        placementScore: Number(review.placementScore),
        placementNote: review.placementNote.trim(),
        priceScore: Number(review.priceScore),
        priceNote: review.priceNote.trim(),
        costScore: Number(review.costScore),
        costNote: review.costNote.trim(),
        overallScore: Number(review.overallScore),
        overallNote: review.overallNote.trim(),
        createdAt: serverTimestamp(),
      });

      navigate(`/housing/${id}`);
    } catch (error) {
      console.error("Feil ved innsending av anmeldelse:", error);
      setSubmitError("Kunne ikke sende inn anmeldelsen. Prov igjen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function fetchHousing() {
      if (!id) return;

      const docRef = doc(db, "listings", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setHousingAddress(`${data.address}${data.city ? ", " + data.city : ""}`);
      }
    }

    fetchHousing();
  }, [id]);

  return (
    <Layout>
    <div className="review-page">
      <header className="review-header">
        <h1>Skriv anmeldelse</h1>
        <p>{housingAddress}</p>
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
              required
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
              required
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
              required
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
              required
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

        <section className="review-section">
          <h2>Visning av navn</h2>
          <label className="review-identity-toggle">
            <input
              type="checkbox"
              className="review-identity-toggle__input"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span className="review-identity-toggle__switch" aria-hidden="true">
              <span className="review-identity-toggle__knob" />
            </span>
            <span className="review-identity-toggle__text">
              {isAnonymous ? "Anonym anmeldelse" : "Vis brukernavn"}
            </span>
          </label>
        </section>

        {submitError && <p className="review-error">{submitError}</p>}

        <div className="review-form-actions">
          <button type="submit" className="review-submit-button" disabled={isSubmitting}>
            {isSubmitting ? "Sender..." : "Send inn"}
          </button>
        </div>
      </form>
    </div>
    </Layout>
  );
}

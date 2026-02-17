import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import "../style/HousingDetailsPage.css";

type Review = {
  id: string;
  userId?: string;
  userName?: string;
  overallScore?: number;
  overallNote?: string;
};

type Housing = {
  id: string;
  name?: string;
  address?: string;
  city?: string;
};

const HousingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [housing, setHousing] = useState<Housing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Hent boligdetaljer
  useEffect(() => {
    const fetchHousing = async () => {
      if (!id) return;
      const housingDoc = await getDoc(doc(db, "listings", id));
      if (housingDoc.exists()) {
        setHousing({ id: housingDoc.id, ...housingDoc.data() } as Housing);
      }
    };
    fetchHousing();
  }, [id]);

  // Hent anmeldelser
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setLoadingReviews(true);
      try {
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("housingId", "==", id)
        );
        const querySnapshot = await getDocs(reviewsQuery);

        const fetchedReviews: Review[] = querySnapshot.docs.map((docItem) => {
          const data = docItem.data() as Omit<Review, "id">;
          return { id: docItem.id, ...data };
        });

        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Feil ved henting av anmeldelser:", error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id]);

  // Naviger til AddReviewPage for denne boligen
  const handleAddReview = () => {
    if (!id) return;
    navigate(`/review/${id}`);
  };

  return (
    <div className="housing-details-page">
      <h1>{housing?.name || "Boligdetaljer"}</h1>

      <div className="housing-details-section">
        <p>
          <strong>Adresse:</strong>{" "}
          {housing?.address || "Adresse ikke tilgjengelig"}
        </p>
        <p>
          <strong>By:</strong> {housing?.city || "Ukjent"}
        </p>
      </div>

      <div className="housing-details-section">
        <h2>Anmeldelser</h2>

        {loadingReviews && <p className="loading-text">Laster anmeldelser...</p>}

        {!loadingReviews && reviews.length === 0 && <p>Ingen anmeldelser ennå.</p>}

        {!loadingReviews && reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <p>
                  <strong>Bruker:</strong> {review.userName || "Anonym"}
                </p>
                <p>
                  <strong>Poeng:</strong> {review.overallScore ?? "-"} / 5
                </p>
                <p>
                  <strong>Kommentar:</strong> {review.overallNote || "Ingen kommentar"}
                </p>
              </div>
            ))}
          </div>
        )}

        <button className="add-review-button" onClick={handleAddReview}>
          Legg til anmeldelse
        </button>
      </div>
    </div>
  );
};

export default HousingDetailsPage;

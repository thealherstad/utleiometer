import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "../style/HousingDetailsPage.css";

type Review = {
  id: string;
  userId?: string;
  userName?: string;
  likes?: string[];
  likeCount?: number;
  overallScore?: number;
  overallNote?: string;
  priceScore?: number;
  priceNote?: string;
  placementScore?: number;
  placementNote?: string;
  costScore?: number;
  costNote?: string;
};

type Housing = {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  price?: number;
  imageUrl?: string;
};

const HousingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [housing, setHousing] = useState<Housing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [bounceIds, setBounceIds] = useState<string[]>([]);

  // Hent bolig
  useEffect(() => {
    if (!id) return;
    const fetchHousing = async () => {
      const housingDoc = await getDoc(doc(db, "listings", id));
      if (housingDoc.exists()) {
        setHousing({ id: housingDoc.id, ...housingDoc.data() } as Housing);
      }
    };
    fetchHousing();
  }, [id]);

  // Hent anmeldelser
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const reviewsQuery = query(collection(db, "reviews"), where("housingId", "==", id));
        const querySnapshot = await getDocs(reviewsQuery);

        const fetchedReviews: Review[] = await Promise.all(
          querySnapshot.docs.map(async (docItem) => {
            const data = docItem.data();
            let userName = "Anonym";

            if (data.userId) {
              try {
                const userDoc = await getDoc(doc(db, "users", data.userId));
                if (userDoc.exists()) {
                  userName = userDoc.data().displayName || "Anonym";
                }
              } catch {}
            }

            const likesArray: string[] = data.likes || [];

            return {
              id: docItem.id,
              userId: data.userId || "",
              userName,
              likes: likesArray,
              likeCount: likesArray.length,
              overallScore: data.overallScore ?? 0,
              overallNote: data.overallNote ?? "",
              priceScore: data.priceScore ?? 0,
              priceNote: data.priceNote ?? "",
              placementScore: data.placementScore ?? 0,
              placementNote: data.placementNote ?? "",
              costScore: data.costScore ?? 0,
              costNote: data.costNote ?? "",
            };
          })
        );

        fetchedReviews.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
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

  // Toggle like og lagre i Firestore
  const toggleLike = async (reviewId: string) => {
    if (!currentUser) return;

    setReviews((prevReviews) => {
      const updated = prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const hasLiked = review.likes?.includes(currentUser.uid);
        const updatedLikes = hasLiked
          ? review.likes?.filter((uid) => uid !== currentUser.uid) || []
          : [...(review.likes || []), currentUser.uid];

        return { ...review, likes: updatedLikes, likeCount: updatedLikes.length };
      });

      updated.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      setBounceIds(updated.map((r) => r.id));
      return updated;
    });

    try {
      const reviewRef = doc(db, "reviews", reviewId);

      // Hent siste versjon fra Firestore
      const reviewSnap = await getDoc(reviewRef);
      if (!reviewSnap.exists()) return;

      const likesFromFirestore: string[] = reviewSnap.data().likes || [];
      const hasLiked = likesFromFirestore.includes(currentUser.uid);

      const likesToUpdate = hasLiked
        ? likesFromFirestore.filter((uid) => uid !== currentUser.uid)
        : [...likesFromFirestore, currentUser.uid];

      await updateDoc(reviewRef, { likes: likesToUpdate });
    } catch (error) {
      console.error("Kunne ikke oppdatere likes i Firestore:", error);
    }

    setTimeout(() => setBounceIds([]), 600);
  };

  const handleAddReview = () => {
    if (!id) return;
    navigate(`/review/${id}`);
  };

  return (
    <div className="housing-details-page">
      {housing && (
        <div className="housing-info">
          {housing.imageUrl && <img src={housing.imageUrl} alt={housing.title || "Boligbilde"} className="housing-image" />}
          <div className="housing-text">
            <h1>{housing.title || "Boligdetaljer"}</h1>
            <p><strong>Adresse:</strong> {housing.address || "Ikke tilgjengelig"}</p>
            <p><strong>By:</strong> {housing.city || "Ukjent"}</p>
            {housing.price !== undefined && <p><strong>Pris:</strong> {housing.price.toLocaleString()} kr/mnd</p>}
          </div>
        </div>
      )}

      <div className="housing-details-section">
        <h2>Anmeldelser</h2>
        {loadingReviews && <p className="loading-text">Laster anmeldelser...</p>}
        {!loadingReviews && reviews.length === 0 && <p>Ingen anmeldelser ennå.</p>}

        {!loadingReviews && reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`review-card ${bounceIds.includes(review.id) ? "bounce" : ""}`}
              >
                <p className="review-user"><strong>Bruker:</strong> {review.userName}</p>

                <div className="review-field">
                  <span><strong>Generelt:</strong> {review.overallScore}/5</span>
                  {review.overallNote && <span className="review-note">Kommentar: {review.overallNote}</span>}
                </div>

                <div className="review-field">
                  <span><strong>Pris:</strong> {review.priceScore}/5</span>
                  {review.priceNote && <span className="review-note">Kommentar: {review.priceNote}</span>}
                </div>

                <div className="review-field">
                  <span><strong>Plassering:</strong> {review.placementScore}/5</span>
                  {review.placementNote && <span className="review-note">Kommentar: {review.placementNote}</span>}
                </div>

                <div className="review-field">
                  <span><strong>Kostnader:</strong> {review.costScore}/5</span>
                  {review.costNote && <span className="review-note">Kommentar: {review.costNote}</span>}
                </div>

                <div className="review-actions">
                  <span
                    className={`heart ${review.likes?.includes(currentUser?.uid || "") ? "liked" : ""}`}
                    onClick={() => toggleLike(review.id)}
                  >
                    ♥
                  </span>
                  <span className="like-count">{review.likeCount || 0}</span>
                </div>

                <button className="report-button">Rapporter</button>
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
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onAuthStateChanged, type User } from "firebase/auth";
import "../style/HousingDetailsPage.css";
import Layout from "../components/Layout";
import { calculateListingRating } from "../services/ratingService";

type Review = {
  id: string;
  userId?: string;
  userName?: string;
  isAnonymous?: boolean;
  likes?: string[];
  likeCount?: number;
  reports?: string[];
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
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const [housing, setHousing] = useState<Housing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [bounceIds, setBounceIds] = useState<string[]>([]);
  const [likeInFlightIds, setLikeInFlightIds] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  // Fetch listing
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

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    setLoadingReviews(true);

    const reviewsQuery = query(
      collection(db, "reviews"),
      where("housingId", "==", id)
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      async (querySnapshot) => {
        try {
          const fetchedReviews: Review[] = await Promise.all(
            querySnapshot.docs.map(async (docItem) => {
              const data = docItem.data();
              let userName = "Anonym";
              const isAnonymous = Boolean(data.isAnonymous);

              if (!isAnonymous && data.submittedByName) {
                userName = data.submittedByName;
              } else if (!isAnonymous && data.userId) {
                try {
                  const userDoc = await getDoc(doc(db, "users", data.userId));
                  if (userDoc.exists()) {
                    userName = userDoc.data().displayName || "Anonym";
                  }
                } catch {}
              }

              const likesArray: string[] = Array.isArray(data.likes)
                ? data.likes.filter(
                    (uid: unknown): uid is string => typeof uid === "string"
                  )
                : [];

              const reportsArray: string[] = Array.isArray(data.reports)
                ? data.reports.filter(
                    (uid: unknown): uid is string => typeof uid === "string"
                  )
                : [];

              return {
                id: docItem.id,
                userId: data.userId || "",
                userName,
                isAnonymous,
                likes: likesArray,
                likeCount: likesArray.length,
                reports: reportsArray,
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

          fetchedReviews.sort(
            (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
          );

          setReviews(fetchedReviews);
        } catch (error) {
          console.error("Feil ved henting av anmeldelser:", error);
          setReviews([]);
        } finally {
          setLoadingReviews(false);
        }
      },
      (error) => {
        console.error("Feil ved sanntidslytting av anmeldelser:", error);
        setReviews([]);
        setLoadingReviews(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Toggle like
  const toggleLike = async (reviewId: string) => {
    if (!currentUser) {
      alert("Du må være innlogget for å like en anmeldelse.");
      return;
    }

    if (likeInFlightIds.includes(reviewId)) {
      return;
    }

    setLikeInFlightIds((prev) => [...prev, reviewId]);
    setBounceIds([reviewId]);

    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewSnapshot = await getDoc(reviewRef);

      if (!reviewSnapshot.exists()) return;

      const reviewData = reviewSnapshot.data();
      const likesArray: string[] = Array.isArray(reviewData.likes)
        ? reviewData.likes.filter(
            (uid: unknown): uid is string => typeof uid === "string"
          )
        : [];

      const hasLiked = likesArray.includes(currentUser.uid);

      const nextLikes = hasLiked
        ? likesArray.filter((uid) => uid !== currentUser.uid)
        : [...likesArray, currentUser.uid];

      await updateDoc(reviewRef, { likes: nextLikes });
    } catch (error) {
      console.error("Kunne ikke oppdatere likes i Firestore:", error);
    } finally {
      setLikeInFlightIds((prev) => prev.filter((id) => id !== reviewId));
    }

    setTimeout(() => setBounceIds([]), 600);
  };

  // Toggle report
  const toggleReport = async (reviewId: string) => {
    if (!currentUser) {
      alert("Du må være innlogget for å rapportere.");
      return;
    }

    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewSnapshot = await getDoc(reviewRef);

      if (!reviewSnapshot.exists()) return;

      const reviewData = reviewSnapshot.data();

      const reportsArray: string[] = Array.isArray(reviewData.reports)
        ? reviewData.reports
        : [];

      const hasReported = reportsArray.includes(currentUser.uid);

      const nextReports = hasReported
        ? reportsArray.filter((uid) => uid !== currentUser.uid)
        : [...reportsArray, currentUser.uid];

      await updateDoc(reviewRef, { reports: nextReports });
    } catch (error) {
      console.error("Kunne ikke rapportere anmeldelse:", error);
    }
  };

  const handleAddReview = () => {
    if (!id) return;
    navigate(`/review/${id}`);
  };

  const rating = calculateListingRating(reviews);

  return (
    <Layout>
      <div className="housing-details-page">
        {housing && (
          <div className="housing-info">
            {housing.imageUrl && (
              <img
                src={housing.imageUrl}
                alt={housing.title || "Boligbilde"}
                className="housing-image"
              />
            )}

            <div className="housing-text">
              <h1>
                {housing.title || "Adresse:"}{" "}
                {housing.address || "Ikke tilgjengelig"}
              </h1>

              <p>
                <strong>By:</strong> {housing.city || "Ukjent"}
              </p>

              {housing.price !== undefined && (
                <p>
                  <strong>Pris:</strong>{" "}
                  {housing.price.toLocaleString()} kr/mnd
                </p>
              )}

              <p>
                <strong>Rating:</strong>{" "}
                {rating > 0 ? `${rating}` : "Ingen rating enda"}
              </p>
            </div>
          </div>
        )}

        <div className="housing-details-section">
          <h2>Anmeldelser</h2>

          {loadingReviews && (
            <p className="loading-text">Laster anmeldelser...</p>
          )}

          {!loadingReviews && reviews.length === 0 && (
            <p>Ingen anmeldelser ennå.</p>
          )}

          {!loadingReviews && reviews.length > 0 && (
            <div className="reviews-list">
              {reviews.map((review) => {
                const hasLiked =
                  review.likes?.includes(currentUser?.uid || "") || false;

                const isReported =
                  review.reports?.includes(currentUser?.uid || "") || false;

                return (
                  <div
                    key={review.id}
                    className={`review-card ${
                      bounceIds.includes(review.id) ? "bounce" : ""
                    } ${isReported ? "reported" : ""}`}
                  >
                    <p className="review-user">
                      <strong>Bruker:</strong> {review.userName}
                    </p>

                    <div className="review-field">
                      <span>
                        <strong>Generelt:</strong> {review.overallScore}/5
                      </span>

                      {review.overallNote && (
                        <span className="review-note">
                          Kommentar: {review.overallNote}
                        </span>
                      )}
                    </div>

                    <div className="review-field">
                      <span>
                        <strong>Pris:</strong> {review.priceScore}/5
                      </span>

                      {review.priceNote && (
                        <span className="review-note">
                          Kommentar: {review.priceNote}
                        </span>
                      )}
                    </div>

                    <div className="review-field">
                      <span>
                        <strong>Plassering:</strong>{" "}
                        {review.placementScore}/5
                      </span>

                      {review.placementNote && (
                        <span className="review-note">
                          Kommentar: {review.placementNote}
                        </span>
                      )}
                    </div>

                    <div className="review-field">
                      <span>
                        <strong>Kostnader:</strong> {review.costScore}/5
                      </span>

                      {review.costNote && (
                        <span className="review-note">
                          Kommentar: {review.costNote}
                        </span>
                      )}
                    </div>

                    <div className="review-actions">
                      <span
                        className={`heart ${hasLiked ? "liked" : ""}`}
                        onClick={() => toggleLike(review.id)}
                      >
                        ♥
                      </span>

                      <span className="like-count">
                        {review.likeCount || 0}
                      </span>
                    </div>

                    <button
                      className="report-button"
                      onClick={() => toggleReport(review.id)}
                    >
                      {isReported ? "Fjern rapportering" : "Rapporter"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="add-review-button"
            onClick={handleAddReview}
          >
            Legg til anmeldelse
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default HousingDetailsPage;

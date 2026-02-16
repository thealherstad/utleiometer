import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { deleteUser, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import type { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import "../style/LoginPage.css";

type UserReview = {
  id: string;
  housingId: string;
  userId?: string;
  placementScore?: number;
  placementNote?: string;
  priceScore?: number;
  priceNote?: string;
  costScore?: number;
  costNote?: string;
  overallScore?: number;
  overallNote?: string;
  createdAt?: { toDate?: () => Date };
};

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

const emptyReviewForm: ReviewFormState = {
  placementScore: "",
  placementNote: "",
  priceScore: "",
  priceNote: "",
  costScore: "",
  costNote: "",
  overallScore: "",
  overallNote: "",
};

const getFirebaseErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const maybeCode = "code" in error ? String((error as { code?: unknown }).code) : "";
    const maybeMessage =
      "message" in error ? String((error as { message?: unknown }).message) : "";
    if (maybeCode || maybeMessage) {
      return `${maybeCode ? `${maybeCode}: ` : ""}${maybeMessage}`;
    }
  }
  return "Ukjent feil";
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [usernameInput, setUsernameInput] = useState(auth.currentUser?.displayName || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewForm);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUsernameInput(user?.displayName || "");

      if (!user) {
        setReviews([]);
        setSelectedReviewId(null);
        setIsReviewModalOpen(false);
        setLoadingReviews(false);
        return;
      }

      try {
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(reviewsQuery);

        const userReviews: UserReview[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserReview, "id">),
        }));

        userReviews.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });

        setReviews(userReviews);
        setSelectedReviewId((previousSelectedId) => {
          if (previousSelectedId && userReviews.some((review) => review.id === previousSelectedId)) {
            return previousSelectedId;
          }
          return userReviews.length > 0 ? userReviews[0].id : null;
        });
      } catch {
        setReviews([]);
        setSelectedReviewId(null);
        setIsReviewModalOpen(false);
      } finally {
        setLoadingReviews(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/logg-inn");
    } catch {
      alert("Noe gikk galt ved logout");
    }
  };

  const handleUsernameUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    const user = auth.currentUser;
    const trimmedUsername = usernameInput.trim();

    if (!user) {
      alert("Fant ingen innlogget bruker.");
      return;
    }

    if (!trimmedUsername) {
      alert("Brukernavn kan ikke være tomt.");
      return;
    }

    try {
      setSavingUsername(true);
      await updateProfile(user, { displayName: trimmedUsername });
      await user.reload();
      setCurrentUser(auth.currentUser);
      setUsernameInput(auth.currentUser?.displayName || trimmedUsername);
      setIsEditingUsername(false);
      alert("Brukernavn oppdatert");
    } catch {
      alert("Noe gikk galt ved oppdatering av brukernavn");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Er du sikker pa at du vil slette profilen din? Dette kan ikke angres."
    );

    if (!confirmed) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      alert("Fant ingen innlogget bruker.");
      return;
    }

    try {
      await deleteUser(user);
      await signOut(auth);
      navigate("/logg-inn");
    } catch {
      alert("Noe gikk galt ved sletting av profilen");
    }
  };

  const selectedReview = reviews.find((review) => review.id === selectedReviewId) || null;

  const startEditingReview = (review: UserReview) => {
    setIsEditingReview(true);
    setReviewForm({
      placementScore: review.placementScore !== undefined ? String(review.placementScore) : "",
      placementNote: review.placementNote || "",
      priceScore: review.priceScore !== undefined ? String(review.priceScore) : "",
      priceNote: review.priceNote || "",
      costScore: review.costScore !== undefined ? String(review.costScore) : "",
      costNote: review.costNote || "",
      overallScore: review.overallScore !== undefined ? String(review.overallScore) : "",
      overallNote: review.overallNote || "",
    });
  };

  const handleReviewFormChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setReviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveReview = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedReview) {
      return;
    }

    const loggedInUser = auth.currentUser;

    if (!loggedInUser) {
      alert("Du må være innlogget for å redigere anmeldelse");
      return;
    }

    const reviewDocRef = doc(db, "reviews", selectedReview.id);

    try {
      setSavingReview(true);
      await updateDoc(reviewDocRef, {
        userId: loggedInUser.uid,
        placementScore: Number(reviewForm.placementScore),
        placementNote: reviewForm.placementNote,
        priceScore: Number(reviewForm.priceScore),
        priceNote: reviewForm.priceNote,
        costScore: Number(reviewForm.costScore),
        costNote: reviewForm.costNote,
        overallScore: Number(reviewForm.overallScore),
        overallNote: reviewForm.overallNote,
      });

      setReviews((previousReviews) =>
        previousReviews.map((review) =>
          review.id === selectedReview.id
            ? {
                ...review,
              userId: loggedInUser.uid,
                placementScore: Number(reviewForm.placementScore),
                placementNote: reviewForm.placementNote,
                priceScore: Number(reviewForm.priceScore),
                priceNote: reviewForm.priceNote,
                costScore: Number(reviewForm.costScore),
                costNote: reviewForm.costNote,
                overallScore: Number(reviewForm.overallScore),
                overallNote: reviewForm.overallNote,
              }
            : review
        )
      );

      setIsEditingReview(false);
      alert("Anmeldelse oppdatert");
    } catch (error) {
      console.error("Feil ved oppdatering av anmeldelse:", error);
      alert(`Noe gikk galt ved oppdatering av anmeldelsen: ${getFirebaseErrorMessage(error)}`);
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) {
      return;
    }

    const reviewIdToDelete = selectedReview.id;

    if (!auth.currentUser) {
      alert("Du må være innlogget for å slette anmeldelse");
      return;
    }

    const confirmed = window.confirm("Er du sikker på at du vil slette denne anmeldelsen?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "reviews", reviewIdToDelete));

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review.id !== reviewIdToDelete)
      );

      setSelectedReviewId(null);
      setIsReviewModalOpen(false);

      setIsEditingReview(false);
      setReviewForm(emptyReviewForm);
      alert("Anmeldelse slettet");
    } catch (error) {
      console.error("Feil ved sletting av anmeldelse:", error);
      alert(`Noe gikk galt ved sletting av anmeldelsen: ${getFirebaseErrorMessage(error)}`);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: "640px" }}>
        <h2 className="login-title">Profil</h2>

        <div style={{ marginBottom: "24px", textAlign: "left" }}>
          <p style={{ margin: "0 0 8px 0" }}>
            <strong>Brukernavn:</strong> {currentUser?.displayName || "Ikke satt"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>E-post:</strong> {currentUser?.email || "Ikke tilgjengelig"}
          </p>
        </div>

        <div style={{ width: "100%", textAlign: "left", marginBottom: "24px" }}>
          {!isEditingUsername && (
            <button
              className="login-button secondary"
              type="button"
              onClick={() => setIsEditingUsername(true)}
              style={{ width: "auto", padding: "8px 12px", marginBottom: 0 }}
            >
              Rediger brukernavn
            </button>
          )}

          {isEditingUsername && (
            <form onSubmit={handleUsernameUpdate}>
              <input
                className="login-input"
                type="text"
                placeholder="Nytt brukernavn"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                style={{ marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="login-button primary"
                  type="submit"
                  disabled={savingUsername}
                  style={{ width: "auto", padding: "10px 14px", marginBottom: 0 }}
                >
                  {savingUsername ? "Lagrer..." : "Lagre"}
                </button>
                <button
                  className="login-button secondary"
                  type="button"
                  onClick={() => {
                    setUsernameInput(currentUser?.displayName || "");
                    setIsEditingUsername(false);
                  }}
                  style={{ width: "auto", padding: "10px 14px", marginBottom: 0 }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          style={{
            width: "100%",
            textAlign: "left",
            marginBottom: "24px",
            borderTop: "1px solid #ddd",
            paddingTop: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Mine anmeldelser</h3>

          {loadingReviews && <p>Laster anmeldelser...</p>}

          {!loadingReviews && reviews.length === 0 && (
            <p>Du har ikke sendt inn noen anmeldelser enda.</p>
          )}

          {!loadingReviews &&
            reviews.map((review) => (
              <div
                key={review.id}
                onClick={() => {
                  setSelectedReviewId(review.id);
                  setIsEditingReview(false);
                  setIsReviewModalOpen(true);
                }}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  backgroundColor: selectedReviewId === review.id ? "#f3f4f6" : "white",
                }}
              >
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Bolig:</strong> {review.housingId || "Ukjent"}
                </p>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Generelt score:</strong> {review.overallScore ?? "-"}/5
                </p>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Kommentar:</strong> {review.overallNote || "Ingen kommentar"}
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                  {review.createdAt?.toDate
                    ? `Sendt inn: ${review.createdAt.toDate().toLocaleString("no-NO")}`
                    : "Sendt inn: ukjent tidspunkt"}
                </p>
                <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#444", fontWeight: 700 }}>
                  Vis detaljer
                </p>
              </div>
            ))}
        </div>

        {!loadingReviews && selectedReview && isReviewModalOpen && (
          <div
            onClick={() => {
              setIsReviewModalOpen(false);
              setIsEditingReview(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
              padding: "16px",
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                width: "100%",
                maxWidth: "720px",
                maxHeight: "85vh",
                overflowY: "auto",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h4 style={{ margin: 0 }}>Detaljer for valgt anmeldelse</h4>
                <button
                  className="login-button secondary"
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setIsEditingReview(false);
                  }}
                  style={{ width: "auto", padding: "8px 12px", marginBottom: 0 }}
                >
                  Lukk
                </button>
              </div>

              <p style={{ margin: "0 0 10px 0" }}>
                <strong>Bolig:</strong> {selectedReview.housingId || "Ukjent"}
              </p>

              {!isEditingReview && (
                <>
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Plassering:</strong> {selectedReview.placementScore ?? "-"}/5
                  </p>
                  <p style={{ margin: "0 0 10px 0" }}>
                    <strong>Kommentar plassering:</strong> {selectedReview.placementNote || "Ingen kommentar"}
                  </p>

                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Pris:</strong> {selectedReview.priceScore ?? "-"}/5
                  </p>
                  <p style={{ margin: "0 0 10px 0" }}>
                    <strong>Kommentar pris:</strong> {selectedReview.priceNote || "Ingen kommentar"}
                  </p>

                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Kostnader:</strong> {selectedReview.costScore ?? "-"}/5
                  </p>
                  <p style={{ margin: "0 0 10px 0" }}>
                    <strong>Kommentar kostnader:</strong> {selectedReview.costNote || "Ingen kommentar"}
                  </p>

                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Generelt:</strong> {selectedReview.overallScore ?? "-"}/5
                  </p>
                  <p style={{ margin: "0 0 10px 0" }}>
                    <strong>Kommentar generelt:</strong> {selectedReview.overallNote || "Ingen kommentar"}
                  </p>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="login-button secondary"
                      type="button"
                      onClick={() => startEditingReview(selectedReview)}
                      style={{ width: "auto", padding: "10px 14px", marginBottom: 0 }}
                    >
                      Rediger
                    </button>
                    <button
                      className="login-button"
                      type="button"
                      onClick={handleDeleteReview}
                      style={{
                        width: "auto",
                        padding: "10px 14px",
                        marginBottom: 0,
                        backgroundColor: "#b71c1c",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Slett anmeldelse
                    </button>
                  </div>
                </>
              )}

              {isEditingReview && (
                <form onSubmit={handleSaveReview}>
                  <label>
                    Plassering poeng (1-5)
                    <select
                      name="placementScore"
                      value={reviewForm.placementScore}
                      onChange={handleReviewFormChange}
                      required
                      className="login-input"
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
                    Kommentar plassering
                    <textarea
                      name="placementNote"
                      value={reviewForm.placementNote}
                      onChange={handleReviewFormChange}
                      rows={3}
                      className="login-input"
                    />
                  </label>

                  <label>
                    Pris poeng (1-5)
                    <select
                      name="priceScore"
                      value={reviewForm.priceScore}
                      onChange={handleReviewFormChange}
                      required
                      className="login-input"
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
                    Kommentar pris
                    <textarea
                      name="priceNote"
                      value={reviewForm.priceNote}
                      onChange={handleReviewFormChange}
                      rows={3}
                      className="login-input"
                    />
                  </label>

                  <label>
                    Kostnader poeng (1-5)
                    <select
                      name="costScore"
                      value={reviewForm.costScore}
                      onChange={handleReviewFormChange}
                      required
                      className="login-input"
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
                    Kommentar kostnader
                    <textarea
                      name="costNote"
                      value={reviewForm.costNote}
                      onChange={handleReviewFormChange}
                      rows={3}
                      className="login-input"
                    />
                  </label>

                  <label>
                    Generelt poeng (1-5)
                    <select
                      name="overallScore"
                      value={reviewForm.overallScore}
                      onChange={handleReviewFormChange}
                      required
                      className="login-input"
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
                    Kommentar generelt
                    <textarea
                      name="overallNote"
                      value={reviewForm.overallNote}
                      onChange={handleReviewFormChange}
                      rows={3}
                      className="login-input"
                    />
                  </label>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="login-button primary"
                      type="submit"
                      disabled={savingReview}
                      style={{ width: "auto", padding: "10px 14px", marginBottom: 0 }}
                    >
                      {savingReview ? "Lagrer..." : "Lagre endringer"}
                    </button>
                    <button
                      className="login-button secondary"
                      type="button"
                      onClick={() => setIsEditingReview(false)}
                      style={{ width: "auto", padding: "10px 14px", marginBottom: 0 }}
                    >
                      Avbryt
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <button
          className="login-button"
          style={{
            backgroundColor: "#e53935",
            color: "white",
            fontSize: "18px",
            fontWeight: 700,
          }}
          onClick={handleLogout}
        >
          Logg ut
        </button>

        <button
          className="login-button"
          style={{
            backgroundColor: "#b71c1c",
            color: "white",
            fontSize: "18px",
            fontWeight: 700,
            marginTop: "12px",
          }}
          onClick={handleDeleteProfile}
        >
          Slett profil
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

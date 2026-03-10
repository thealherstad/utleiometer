import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import "../style/LoginPage.css";
import "../style/ProfilePage.css";
import Layout from "../components/Layout";

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
  housingAddress?: string;
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

const getDeleteProfileErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: unknown }).code);

    if (code === "auth/wrong-password") {
      return "Feil passord. Prøv igjen.";
    }

    if (code === "auth/invalid-credential") {
      return "Ugyldig innlogging. Logg inn på nytt og prøv igjen.";
    }

    if (code === "auth/requires-recent-login") {
      return "Av sikkerhetsgrunner må du logge inn på nytt før kontoen kan slettes.";
    }
  }

  return `Noe gikk galt ved sletting av profilen: ${getFirebaseErrorMessage(error)}`;
};

const deleteReviewsForUser = async (userId: string) => {
  const userReviewsQuery = query(collection(db, "reviews"), where("userId", "==", userId));
  const userReviewsSnapshot = await getDocs(userReviewsQuery);

  if (userReviewsSnapshot.empty) {
    return;
  }

  const reviewDocs = userReviewsSnapshot.docs;
  const chunkSize = 400;

  for (let index = 0; index < reviewDocs.length; index += chunkSize) {
    const chunk = reviewDocs.slice(index, index + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((reviewDoc) => {
      batch.delete(reviewDoc.ref);
    });

    await batch.commit();
  }
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
  const [deletingProfile, setDeletingProfile] = useState(false);
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

        const userReviews: UserReview[] = await Promise.all(
          querySnapshot.docs.map(async (docItem) => {
           const reviewData = docItem.data() as Omit<UserReview, "id" | "housingAddress">;
           let housingAddress = "";

  
           const housingDoc = await getDoc(doc(db, "listings", reviewData.housingId));
          if (housingDoc.exists()) {
            const data = housingDoc.data();
            housingAddress = `${data.address}${data.city ? ", " + data.city : ""}`;
        }

        return {
         id: docItem.id,
         ...reviewData,
         housingAddress, // sett her
       };
     }) 
    );


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

    if (!user.email) {
      alert("Fant ikke e-post for brukeren. Logg inn på nytt og prøv igjen.");
      return;
    }

    try {
      setDeletingProfile(true);

      const password = window.prompt("Skriv inn passordet ditt for å bekrefte sletting av profil:");

      if (password === null) {
        return;
      }

      if (!password.trim()) {
        alert("Passord kan ikke være tomt.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await deleteReviewsForUser(user.uid);

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/logg-inn");
    } catch (error) {
      console.error("Feil ved sletting av profil:", error);
      alert(getDeleteProfileErrorMessage(error));
    } finally {
      setDeletingProfile(false);
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
    <Layout>
    <div className="login-wrapper">
      <div className="login-card profile-card">
        <h2 className="login-title">Profil</h2>

        <div className="profile-user-info">
          <p className="profile-user-row">
            <strong>Brukernavn:</strong> {currentUser?.displayName || "Ikke satt"}
          </p>
          <p className="profile-user-row profile-user-row-last">
            <strong>E-post:</strong> {currentUser?.email || "Ikke tilgjengelig"}
          </p>
        </div>

        <div className="profile-username-section">
          {!isEditingUsername && (
            <button
              className="login-button secondary profile-inline-button profile-inline-button-small"
              type="button"
              onClick={() => setIsEditingUsername(true)}
            >
              Rediger brukernavn
            </button>
          )}

          {isEditingUsername && (
            <form onSubmit={handleUsernameUpdate}>
              <input
                className="login-input profile-username-input"
                type="text"
                placeholder="Nytt brukernavn"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
              <div className="profile-inline-actions">
                <button
                  className="login-button primary profile-inline-button"
                  type="submit"
                  disabled={savingUsername}
                >
                  {savingUsername ? "Lagrer..." : "Lagre"}
                </button>
                <button
                  className="login-button secondary profile-inline-button"
                  type="button"
                  onClick={() => {
                    setUsernameInput(currentUser?.displayName || "");
                    setIsEditingUsername(false);
                  }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-reviews-section">
          <h3 className="profile-section-title">Mine anmeldelser</h3>

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
                className={`profile-review-card ${
                  selectedReviewId === review.id ? "profile-review-card-selected" : ""
                }`}
              >
                <p className="profile-review-line">
                  <strong>Bolig:</strong> {review.housingAddress || "Ukjent"}
                </p>
                <p className="profile-review-line">
                  <strong>Generelt score:</strong> {review.overallScore ?? "-"}/5
                </p>
                <p className="profile-review-line">
                  <strong>Kommentar:</strong> {review.overallNote || "Ingen kommentar"}
                </p>
                <p className="profile-review-time">
                  {review.createdAt?.toDate
                    ? `Sendt inn: ${review.createdAt.toDate().toLocaleString("no-NO")}`
                    : "Sendt inn: ukjent tidspunkt"}
                </p>
                <p className="profile-review-details-hint">
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
            className="profile-modal-overlay"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="profile-modal"
            >
              <div className="profile-modal-header">
                <h4 className="profile-modal-title">Detaljer for valgt anmeldelse</h4>
                <button
                  className="login-button secondary profile-inline-button profile-inline-button-small"
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setIsEditingReview(false);
                  }}
                >
                  Lukk
                </button>
              </div>

              <p className="profile-modal-line profile-modal-line-spaced">
                <strong>Bolig:</strong> {selectedReview.housingAddress || "Ukjent"}
              </p>

              {!isEditingReview && (
                <>
                  <p className="profile-modal-line">
                    <strong>Plassering:</strong> {selectedReview.placementScore ?? "-"}/5
                  </p>
                  <p className="profile-modal-line profile-modal-line-spaced">
                    <strong>Kommentar plassering:</strong> {selectedReview.placementNote || "Ingen kommentar"}
                  </p>

                  <p className="profile-modal-line">
                    <strong>Pris:</strong> {selectedReview.priceScore ?? "-"}/5
                  </p>
                  <p className="profile-modal-line profile-modal-line-spaced">
                    <strong>Kommentar pris:</strong> {selectedReview.priceNote || "Ingen kommentar"}
                  </p>

                  <p className="profile-modal-line">
                    <strong>Kostnader:</strong> {selectedReview.costScore ?? "-"}/5
                  </p>
                  <p className="profile-modal-line profile-modal-line-spaced">
                    <strong>Kommentar kostnader:</strong> {selectedReview.costNote || "Ingen kommentar"}
                  </p>

                  <p className="profile-modal-line">
                    <strong>Generelt:</strong> {selectedReview.overallScore ?? "-"}/5
                  </p>
                  <p className="profile-modal-line profile-modal-line-spaced">
                    <strong>Kommentar generelt:</strong> {selectedReview.overallNote || "Ingen kommentar"}
                  </p>

                  <div className="profile-inline-actions">
                    <button
                      className="login-button secondary profile-inline-button"
                      type="button"
                      onClick={() => startEditingReview(selectedReview)}
                    >
                      Rediger
                    </button>
                    <button
                      className="login-button profile-inline-button profile-delete-review-button"
                      type="button"
                      onClick={handleDeleteReview}
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

                  <div className="profile-inline-actions">
                    <button
                      className="login-button primary profile-inline-button"
                      type="submit"
                      disabled={savingReview}
                    >
                      {savingReview ? "Lagrer..." : "Lagre endringer"}
                    </button>
                    <button
                      className="login-button secondary profile-inline-button"
                      type="button"
                      onClick={() => setIsEditingReview(false)}
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
          className="login-button profile-logout-button"
          onClick={handleLogout}
        >
          Logg ut
        </button>

        <button
          className="login-button profile-delete-profile-button"
          onClick={handleDeleteProfile}
          disabled={deletingProfile}
        >
          {deletingProfile ? "Sletter profil..." : "Slett profil"}
        </button>
      </div>
    </div>
  </Layout>
  );
};

export default ProfilePage;

import { useMemo, useState } from "react";
import "../style/AddListingPage.css";
import { DuplicateListingError, saveListing } from "../services/listingService";
import Layout from "../components/Layout";
import { auth } from "../firebase";

type FormState = {
  address: string;
  postalCode: string;
  poststed: string;
  city: string;
  price: string;
  notes: string;
  imageUrl: string;
};

type TouchedState = Partial<Record<keyof FormState, boolean>>;

type ErrorsState = Partial<Record<keyof FormState, string>>;

export default function AddListingPage() {
  const [form, setForm] = useState<FormState>({
    address: "",
    postalCode: "",
    poststed: "",
    city: "",
    price: "",
    notes: "",
    imageUrl: "",
  });

  const [touched, setTouched] = useState<TouchedState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errors = useMemo<ErrorsState>(() => {
    const e: ErrorsState = {};

    if (!form.address.trim()) e.address = "Skriv inn adresse.";

    if (form.postalCode && !/^\d{4}$/.test(form.postalCode)) {
      e.postalCode = "Postnummer må være 4 siffer.";
    }

    if (form.city && form.city.trim().length < 2) {
      e.city = "By må være minst 2 tegn.";
    }

    if (!form.price.trim()) {
      e.price = "Pris er obligatorisk."
    }

    if (form.notes && form.notes.length > 250) {
      e.notes = "Kommentar kan maks være 250 tegn.";
    }

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onBlur<K extends keyof FormState>(name: K) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("=== handleSubmit kallt ===");
    console.log("Form data før validering:", form);
    console.log("isValid status:", isValid);
    console.log("Errors:", errors);

    setTouched({
      address: true,
      postalCode: true,
      poststed: true,
      city: true,
      price: true,
      notes: true,
    });

    if (!isValid) {
      console.log("❌ Form er IKKE valid - stopper her");
      return;
    }

    if (!auth.currentUser) {
      setErrorMessage("Du må være innlogget for å sende inn bolig.");
      setSuccessMessage(null);
      return;
    }

    console.log("✅ Form er valid - starter lagring");
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Lagre til Firestore
      console.log("Kaller saveListing med:", {
        address: form.address,
        postalCode: form.postalCode,
        poststed: form.poststed,
        city: form.city,
        price: form.price,
        notes: form.notes,
      });
      
      await saveListing({
        address: form.address,
        postalCode: form.postalCode,
        poststed: form.poststed,
        city: form.city,
        price: Number(form.price),
        notes: form.notes,
        imageUrl: form.imageUrl || "",
      });

      console.log("✅ saveListing fullført!");
      setSuccessMessage("Boligen er lagret.");

      // Nullstill skjemaet
      setForm({
        address: "",
        postalCode: "",
        poststed: "",
        city: "",
        price: "",
        notes: "",
        imageUrl: "",
      });
      setTouched({});

      // Fjern suksessmelding etter 3 sekunder
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("❌ FEIL ved lagring:", error);
      if (error instanceof DuplicateListingError) {
        setErrorMessage("Denne boligen er allerede registrert.");
      } else {
        setErrorMessage("Feil ved lagring av bolig. Prøv igjen.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
    <div className="page">
      <header className="header">
        <h1>Legg inn bolig</h1>
      </header>

      <main className="content">
        <section className="card">
          <h2>Boligdetaljer</h2>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="grid">
              <div className="field">
                <label htmlFor="address">Adresse *</label>
                <input
                  id="address"
                  type="text"
                  placeholder="F.eks. Elgeseter gate 10"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  onBlur={() => onBlur("address")}
                  aria-invalid={!!(touched.address && errors.address)}
                />
                {touched.address && errors.address && (
                  <span className="error">{errors.address}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="price">Pris *</label>
                <input
                  id="price"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="F.eks. 7000"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
                {touched.price && errors.price && (
                  <span className="error">{errors.price}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="postalCode">Postnummer (valgfritt)</label>
                <input
                  id="postalCode"
                  inputMode="numeric"
                  placeholder="4 siffer"
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  onBlur={() => onBlur("postalCode")}
                  aria-invalid={!!(touched.postalCode && errors.postalCode)}
                />
                {touched.postalCode && errors.postalCode && (
                  <span className="error">{errors.postalCode}</span>
                )}
              </div>
                
              <div className="field"> 
                <label htmlFor="area">Poststed (valgfritt)</label>
                <input
                  type="text"
                  id="poststed"
                  placeholder="Skriv poststed"
                  value={form.poststed || ""}
                  onChange={(e) => setField("poststed", e.target.value)}
                  onBlur={() => onBlur("poststed")}
                  aria-invalid={!!(touched.poststed && errors.poststed)}
                  />
                {touched.poststed && errors.poststed && (
                  <span className="error">{errors.poststed}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="city">By (valgfritt)</label>
                <input
                  id="city"
                  type="text"
                  placeholder="F.eks. Trondheim"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  onBlur={() => onBlur("city")}
                  aria-invalid={!!(touched.city && errors.city)}
                />
                {touched.city && errors.city && (
                  <span className="error">{errors.city}</span>
                )}
              </div>
              <div className="field full">
                <label htmlFor="imageUrl">Bilde-URL (valgfritt)</label>
                <input
                 id="imageUrl"
                 type="text"
                 placeholder="Lim inn lenke til bilde (https://...)"
                 value={form.imageUrl}
                 onChange={(e) => setField("imageUrl", e.target.value)}
                />
              </div>


              <div className="field full">
                <label htmlFor="notes">
                  Kommentar (valgfritt) <span className="muted">(maks 250)</span>
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="F.eks. inngang B, 3. etasje..."
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  onBlur={() => onBlur("notes")}
                  aria-invalid={!!(touched.notes && errors.notes)}
                />
                <div className="hintRow">
                  <span className="muted">{form.notes.length}/250</span>
                  {touched.notes && errors.notes && (
                    <span className="error">{errors.notes}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="actions">
              <button 
                type="submit" 
                className="primary" 
                disabled={!isValid || isLoading}
              >
                {isLoading ? "Lagrer..." : "Send inn"}
              </button>

              <button
                type="button"
                className="secondary"
                disabled={isLoading}
                onClick={() => {
                  setForm({
                    address: "",
                    postalCode: "",
                    poststed: "",
                    price: "",
                    city: "",
                    notes: "",
                    imageUrl: "",
                  });
                  setTouched({});
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
              >
                Nullstill
              </button>
            </div>

            {successMessage && (
              <p className="successMessage">{successMessage}</p>
            )}

            {errorMessage && (
              <p className="errorMessage">{errorMessage}</p>
            )}

            {!isValid && (
              <p className="formInfo">
                * Fyll inn obligatoriske felt for å sende inn.
              </p>
            )}
          </form>
        </section>

        {/* <section className="card">

          <h2>Forhåndsvisning</h2>
          <div className="preview">
            <div className="row">
              <span className="label">Adresse</span>
              <span className="value">{form.address || "—"}</span>
            </div>
            <div className="row">
              <span className="label">Område</span>
              <span className="value">{form.area || "—"}</span>
            </div>
            <div className="row">
              <span className="label">Postnummer</span>
              <span className="value">{form.postalCode || "—"}</span>
            </div>
            <div className="row">
              <span className="label">By</span>
              <span className="value">{form.city || "—"}</span>
            </div>
            <div className="row">
              <span className="label">Kommentar</span>
              <div className="value">{form.notes || "—"}</div>
            </div>
            {form.imageUrl && (
               <div className="row">
                <span className="label">Bilde</span>
                <img
                  src={form.imageUrl}
                  alt={form.address || "Boligbilde"}
                  style={{
                   maxWidth: "200px",
                   maxHeight: "150px",
                   borderRadius: "8px",
                 }}
               />
             </div>
            )}
          </div>

          {submitted && (
            <div className="submitted">
              <h3>Sendt inn (lokalt)</h3>
              <p className="muted">Tidspunkt: {submitted.createdAt}</p>
              <pre className="code">{JSON.stringify(submitted, null, 2)}</pre>
            </div>
          )}
        </section> */}
      </main>
    </div>
  </Layout>
  );
}

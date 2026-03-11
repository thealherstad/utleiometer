import { useMemo, useState } from "react";
import "../style/AddListingPage.css";
import { DuplicateListingError, saveListing } from "../services/listingService";
import Layout from "../components/Layout";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

    if (!form.address.trim()) {
      e.address = "Adresse må fylles ut.";
    }

    if (!form.price.trim()) {
      e.price = "Pris må fylles ut.";
    } else if (Number(form.price) <= 0) {
      e.price = "Pris må være større enn 0.";
    }

    if (!form.postalCode.trim()) {
      e.postalCode = "Postnummer må fylles ut.";
    } else if (!/^\d{4}$/.test(form.postalCode)) {
      e.postalCode = "Postnummer må være 4 siffer.";
    }

    if (!form.poststed.trim()) {
      e.poststed = "Poststed må fylles ut.";
    }

    if (!form.city.trim()) {
      e.city = "By må fylles ut.";
    } else if (form.city.trim().length < 2) {
      e.city = "By må være minst 2 tegn.";
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

    setTouched({
      address: true,
      postalCode: true,
      poststed: true,
      city: true,
      price: true,
      notes: true,
    });

    if (!isValid) {
      return;
    }

    if (!auth.currentUser) {
      setErrorMessage("Du må være innlogget for å sende inn bolig.");
      setSuccessMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await saveListing({
        address: form.address,
        postalCode: form.postalCode,
        poststed: form.poststed,
        city: form.city,
        price: Number(form.price),
        notes: form.notes,
        imageUrl: form.imageUrl || "",
      });

      setSuccessMessage("Boligen er lagret!");

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

      // Vent litt før redirect slik at bruker ser meldingen
      setTimeout(() => {
        navigate("/boliger");
      }, 1500);
    } catch (error) {
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
                    onBlur={() => onBlur("price")}
                    aria-invalid={!!(touched.price && errors.price)}
                  />
                  {touched.price && errors.price && (
                    <span className="error">{errors.price}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="postalCode">Postnummer *</label>
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
                  <label htmlFor="poststed">Poststed *</label>
                  <input
                    id="poststed"
                    type="text"
                    placeholder="Skriv poststed"
                    value={form.poststed}
                    onChange={(e) => setField("poststed", e.target.value)}
                    onBlur={() => onBlur("poststed")}
                    aria-invalid={!!(touched.poststed && errors.poststed)}
                  />
                  {touched.poststed && errors.poststed && (
                    <span className="error">{errors.poststed}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="city">By *</label>
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
        </main>
      </div>
    </Layout>
  );
}
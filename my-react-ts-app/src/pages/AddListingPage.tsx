import { useMemo, useState } from "react";
import "../style/AddListingPage.css";

const AREAS = [
  "Trondheim",
  "Oslo",
  "Bergen",
  "Stavanger",
  "Tromsø",
  "Ålesund",
  "Annet",
] as const;

type Area = (typeof AREAS)[number];

type FormState = {
  address: string;
  area: "" | Area;
  postalCode: string;
  city: string;
  notes: string;
};

type TouchedState = Partial<Record<keyof FormState, boolean>>;

type ErrorsState = Partial<Record<keyof FormState, string>>;

type SubmittedState = FormState & { createdAt: string };

export default function AddListingPage() {
  const [form, setForm] = useState<FormState>({
    address: "",
    area: "",
    postalCode: "",
    city: "",
    notes: "",
  });

  const [touched, setTouched] = useState<TouchedState>({});
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);

  const errors = useMemo<ErrorsState>(() => {
    const e: ErrorsState = {};

    if (!form.address.trim()) e.address = "Skriv inn adresse.";
    if (!form.area) e.area = "Velg område.";

    if (form.postalCode && !/^\d{4}$/.test(form.postalCode)) {
      e.postalCode = "Postnummer må være 4 siffer.";
    }

    if (form.city && form.city.trim().length < 2) {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setTouched({
      address: true,
      area: true,
      postalCode: true,
      city: true,
      notes: true,
    });

    if (!isValid) return;

    setSubmitted({
      ...form,
      createdAt: new Date().toLocaleString(),
    });

    setForm({
      address: "",
      area: "",
      postalCode: "",
      city: "",
      notes: "",
    });
    setTouched({});
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Legg inn bolig</h1>
        <p>Fyll inn adresse og område.</p>
      </header>

      <main className="content">
        <section className="card">
          <h2>Skjema</h2>

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
                <label htmlFor="area">Område *</label>
                <select
                  id="area"
                  value={form.area}
                  onChange={(e) => setField("area", e.target.value as FormState["area"])}
                  onBlur={() => onBlur("area")}
                  aria-invalid={!!(touched.area && errors.area)}
                >
                  <option value="">Velg område</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {touched.area && errors.area && (
                  <span className="error">{errors.area}</span>
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
              <button type="submit" className="primary" disabled={!isValid}>
                Send inn
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForm({
                    address: "",
                    area: "",
                    postalCode: "",
                    city: "",
                    notes: "",
                  });
                  setTouched({});
                  setSubmitted(null);
                }}
              >
                Nullstill
              </button>
            </div>

            {!isValid && (
              <p className="formInfo">
                * Fyll inn obligatoriske felt for å sende inn.
              </p>
            )}
          </form>
        </section>

        <section className="card">
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
              <span className="value">{form.notes || "—"}</span>
            </div>
          </div>

          {submitted && (
            <div className="submitted">
              <h3>Sendt inn (lokalt)</h3>
              <p className="muted">Tidspunkt: {submitted.createdAt}</p>
              <pre className="code">{JSON.stringify(submitted, null, 2)}</pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
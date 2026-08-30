"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinned,
  Phone,
  UserRound,
} from "lucide-react";

type Option = { id: string; name: string; code: string };
type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  whatsappNumber: string;
  contactConsent: boolean;
  stateId: string;
  localGovernmentId: string;
  wardId: string;
  pollingUnitId: string;
};
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
const organizationSlug = "peoples-first-movement";
const initialForm: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  whatsappNumber: "",
  contactConsent: false,
  stateId: "",
  localGovernmentId: "",
  wardId: "",
  pollingUnitId: "",
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormValues>(initialForm);
  const [states, setStates] = useState<Option[]>([]);
  const [lgas, setLgas] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const steps = useMemo(
    () => [
      {
        label: "First name",
        field: "firstName",
        hint: "What should we call you?",
        icon: <UserRound size={20} />,
        type: "text",
      },
      {
        label: "Last name",
        field: "lastName",
        hint: "Tell us your family name.",
        icon: <UserRound size={20} />,
        type: "text",
      },
      {
        label: "Email address",
        field: "email",
        hint: "This will be your sign-in email.",
        icon: <Mail size={20} />,
        type: "email",
      },
      {
        label: "Create a password",
        field: "password",
        hint: "Use at least 8 characters.",
        icon: <LockKeyhole size={20} />,
        type: "password",
      },
      {
        label: "Phone number",
        field: "phone",
        hint: "Add a phone number, or continue with WhatsApp.",
        icon: <Phone size={20} />,
        type: "tel",
      },
      {
        label: "WhatsApp number",
        field: "whatsappNumber",
        hint: "You can use the same number or leave this blank.",
        icon: <Phone size={20} />,
        type: "tel",
      },
      {
        label: "State",
        field: "stateId",
        hint: "Choose your state.",
        icon: <MapPinned size={20} />,
        type: "select",
        values: states,
      },
      {
        label: "Local Government Area",
        field: "localGovernmentId",
        hint: "Choose your LGA.",
        icon: <MapPinned size={20} />,
        type: "select",
        values: lgas,
      },
      {
        label: "Ward",
        field: "wardId",
        hint: "Choose your ward.",
        icon: <MapPinned size={20} />,
        type: "select",
        values: wards,
      },
      {
        label: "Polling Unit",
        field: "pollingUnitId",
        hint: "Choose your polling unit.",
        icon: <MapPinned size={20} />,
        type: "select",
        values: units,
      },
      {
        label: "Contact consent",
        field: "contactConsent",
        hint: "Allow PFM to contact you through the channels you provided.",
        icon: <Check size={20} />,
        type: "consent",
      },
    ],
    [states, lgas, wards, units],
  );
  const current = steps[step];
  useEffect(() => {
    fetch(
      `${apiUrl}/v1/geography/public/states?organizationSlug=${organizationSlug}`,
    )
      .then((response) => response.json())
      .then(setStates)
      .catch(() => setError("Unable to load registration geography"));
  }, []);
  useEffect(() => {
    setLgas([]);
    setWards([]);
    setUnits([]);
    setForm((value) => ({
      ...value,
      localGovernmentId: "",
      wardId: "",
      pollingUnitId: "",
    }));
    if (form.stateId)
      fetch(
        `${apiUrl}/v1/geography/public/states/${form.stateId}/lgas?organizationSlug=${organizationSlug}`,
      )
        .then((response) => response.json())
        .then(setLgas);
  }, [form.stateId]);
  useEffect(() => {
    setWards([]);
    setUnits([]);
    setForm((value) => ({ ...value, wardId: "", pollingUnitId: "" }));
    if (form.localGovernmentId)
      fetch(
        `${apiUrl}/v1/geography/public/lgas/${form.localGovernmentId}/wards?organizationSlug=${organizationSlug}`,
      )
        .then((response) => response.json())
        .then(setWards);
  }, [form.localGovernmentId]);
  useEffect(() => {
    setUnits([]);
    setForm((value) => ({ ...value, pollingUnitId: "" }));
    if (form.wardId)
      fetch(
        `${apiUrl}/v1/geography/public/wards/${form.wardId}/polling-units?organizationSlug=${organizationSlug}`,
      )
        .then((response) => response.json())
        .then(setUnits);
  }, [form.wardId]);
  function update(field: string, value: string | boolean) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setError("");
  }
  function validateStep() {
    const value = form[current.field as keyof FormValues];
    if (
      current.field === "whatsappNumber" &&
      !form.phone &&
      !form.whatsappNumber
    )
      return "Add a phone number or WhatsApp number to continue.";
    if (current.field === "contactConsent" && !form.contactConsent)
      return "Consent is required to complete registration.";
    if (
      typeof value === "string" &&
      !value.trim() &&
      current.field !== "phone" &&
      current.field !== "whatsappNumber"
    )
      return `${current.label} is required.`;
    if (current.field === "password" && form.password.length < 8)
      return "Your password must be at least 8 characters.";
    return "";
  }
  async function next(event?: FormEvent) {
    event?.preventDefault();
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/v1/auth/register-member`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, organizationSlug }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message ?? "Unable to complete registration");
      setMessage(body.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete registration",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="login-page register-page">
      <section className="login-aside register-aside">
        <div className="brand login-brand">
          <span className="brand-mark">P</span>
          <span>People&apos;s First Movement</span>
        </div>
        <p className="program-name">Adebutu Voters Engagement Program</p>
        <div className="login-aside-copy">
          <p className="eyebrow">Member registration</p>
          <h1>
            Find your place.
            <br />
            Build together.
          </h1>
          <p>
            Create your PFM member account and connect it to the place where you
            organize.
          </p>
          <div className="register-aside-note">
            <MapPinned size={18} />
            <span>
              <strong>One movement, every community</strong>
              <small>
                Your location helps us connect you with the right local team.
              </small>
            </span>
          </div>
        </div>
      </section>
      <section className="login-card register-card">
        {message ? (
          <div className="success-state">
            <div className="register-success-icon">
              <Check size={22} />
            </div>
            <p className="eyebrow">Registration complete</p>
            <h2>You&apos;re on your way.</h2>
            <p>{message}</p>
            <a className="primary-button" href="/login">
              Go to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="register-progress">
              <div>
                <span>
                  Step {step + 1} of {steps.length}
                </span>
                <strong>{current.label}</strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
            <div className="register-heading">
              <div className="register-step-icon">{current.icon}</div>
              <p className="eyebrow">Join PFM</p>
              <h2>{current.label}</h2>
              <p>{current.hint}</p>
            </div>
            <form onSubmit={next}>
              {current.type === "select" ? (
                <label className="wizard-field">
                  <span className="input-wrap">
                    <MapPinned size={17} />
                    <select
                      required
                      value={String(form[current.field as keyof FormValues])}
                      onChange={(event) =>
                        update(current.field, event.target.value)
                      }
                    >
                      <option value="">
                        Choose {current.label.toLowerCase()}
                      </option>
                      {current.values?.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              ) : current.type === "consent" ? (
                <label className="wizard-consent">
                  <input
                    type="checkbox"
                    checked={form.contactConsent}
                    onChange={(event) =>
                      update("contactConsent", event.target.checked)
                    }
                  />
                  <span>
                    I agree to receive relevant PFM communications through the
                    contact channels I provide.
                  </span>
                </label>
              ) : (
                <span className="input-wrap wizard-input">
                  {current.icon}
                  <input
                    autoFocus
                    type={
                      current.type === "password"
                        ? showPassword
                          ? "text"
                          : "password"
                        : current.type
                    }
                    value={String(form[current.field as keyof FormValues])}
                    onChange={(event) =>
                      update(current.field, event.target.value)
                    }
                    placeholder={`Enter your ${current.label.toLowerCase()}`}
                    required={
                      current.field !== "phone" &&
                      current.field !== "whatsappNumber"
                    }
                    minLength={current.field === "password" ? 8 : undefined}
                  />
                  {current.type === "password" && (
                    <button
                      className="password-toggle"
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  )}
                </span>
              )}
              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}
              <div className="wizard-actions">
                {step > 0 ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setStep((value) => value - 1);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                ) : (
                  <a className="secondary-button" href="/login">
                    Cancel
                  </a>
                )}
                <button
                  className="login-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Submitting..."
                    : step === steps.length - 1
                      ? "Complete registration"
                      : "Continue"}
                  {step === steps.length - 1 ? (
                    <Check size={17} />
                  ) : (
                    <ArrowRight size={17} />
                  )}
                </button>
              </div>
            </form>
            <p className="login-footer">
              Already registered? <a href="/login">Sign in</a>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

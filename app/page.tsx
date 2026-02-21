"use client";

import { useEffect, useMemo, useState } from "react";

type Prompt = {
  id: string;
  title: string;
  description: string;
};

const PROMPTS: Prompt[] = [
  { id: "couple-wide", title: "Foto van ons samen", description: "Maak een foto van ons (het bruidspaar) vanaf de plek waar je nu staat." },
  { id: "laughing-guest", title: "Iemand die lacht", description: "Maak een spontane foto van iemand die hardop lacht of een grote glimlach heeft." },
  { id: "venue-wide", title: "De locatie", description: "Maak een overzichtsfoto van de trouwlocatie of de ruimte waar je nu bent." },
  { id: "details", title: "Een mooi detail", description: "Zoom in op een detail dat jij mooi vindt (bloemen, ringen, decoratie, etc.)." },
  { id: "table", title: "Jouw tafel", description: "Maak een foto van jouw tafel (alle mensen aan je tafel mogen erop)." },
  { id: "dancefloor", title: "Dansvloer", description: "Maak een foto van de dansvloer of mensen die dansen." },
  { id: "selfie-new", title: "Selfie met iemand nieuws", description: "Maak een selfie met iemand die je vandaag voor het eerst hebt ontmoet." },
  { id: "candid-couple", title: "Onopvallende foto van ons", description: "Maak een foto van ons zonder dat we er speciaal voor poseren (als dat lukt)." },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "wedding-photo-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(key, newId);
  return newId;
}

type Step = "onboarding" | "taking" | "finished";

function OnboardingCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-wedding-dark uppercase tracking-wide">Onze bruiloft</p>
        <h1 className="text-2xl font-semibold text-gray-900">Help ons de dag vast te leggen</h1>
        <p className="text-sm text-gray-600">
          We hebben geen officiële fotograaf. Jij kunt ons helpen door een paar speciale foto&apos;s te maken met je telefoon.
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Hoe werkt het?</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Je krijgt maximaal 10 korte &quot;foto-opdrachten&quot;.</li>
          <li>Maak een foto per opdracht en upload deze direct.</li>
          <li>Daarna zie je de volgende opdracht, totdat je klaar bent.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Tips voor mooie telefoonfoto&apos;s</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Zorg voor licht van voren (niet met een raam recht achter iemand).</li>
          <li>Tik op het gezicht op je scherm om scherp te stellen.</li>
          <li>Houd je lens even schoon met je trui of doekje.</li>
          <li>Houd je telefoon met twee handen voor een stabiele foto.</li>
        </ul>
      </section>
      <button
        type="button"
        onClick={onStart}
        className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding transition-colors"
      >
        Start met foto&apos;s maken
      </button>
      <p className="text-xs text-gray-500 text-center">
        Door verder te gaan, geef je toestemming om de foto&apos;s met ons te delen.
      </p>
    </div>
  );
}

function PromptFlow({
  prompt,
  currentIndex,
  total,
  selectedFile,
  previewUrl,
  onFileChange,
  onUpload,
  isUploading,
  uploadError,
}: {
  prompt: Prompt;
  currentIndex: number;
  total: number;
  selectedFile: File | null;
  previewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  uploadError: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium text-wedding-dark uppercase tracking-wide">
          Opdracht {currentIndex + 1} van {total}
        </p>
        <h2 className="text-xl font-semibold text-gray-900">{prompt.title}</h2>
        <p className="text-sm text-gray-700">{prompt.description}</p>
      </header>
      <section className="space-y-4">
        {selectedFile && previewUrl ? (
          <div className="space-y-3">
            <img src={previewUrl} alt="Preview" className="w-full rounded-xl object-cover aspect-[4/3] bg-gray-100" />
            <label className="block w-full text-center rounded-full border border-gray-300 text-gray-700 py-2 text-sm font-medium cursor-pointer hover:bg-gray-50">
              Opnieuw
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
            </label>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700">Maak nu een foto voor deze opdracht.</p>
            <p className="text-xs text-gray-500">Je camera wordt alleen gebruikt om deze foto te maken.</p>
            <label className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-medium cursor-pointer hover:bg-gray-800">
              Maak een foto
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
            </label>
          </div>
        )}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </section>
      <button
        type="button"
        onClick={onUpload}
        disabled={!selectedFile || isUploading}
        className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-wedding transition-colors"
      >
        {isUploading ? "Uploaden..." : "Upload foto en ga verder"}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Geen zin meer? Je kunt het scherm altijd sluiten, we zijn je al dankbaar!
      </p>
    </div>
  );
}

function FinishedScreen({
  email,
  selfDescription,
  onEmailChange,
  onSelfDescriptionChange,
  onSubmitEmail,
  emailSubmitted,
}: {
  email: string;
  selfDescription: string;
  onEmailChange: (v: string) => void;
  onSelfDescriptionChange: (v: string) => void;
  onSubmitEmail: (e: React.FormEvent) => void;
  emailSubmitted: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Dankjewel voor je foto&apos;s!</h2>
        <p className="text-sm text-gray-700">
          Jij hebt meegeholpen om onze dag vast te leggen. Dat waarderen we enorm.
        </p>
      </header>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 text-center">Foto&apos;s van jezelf ontvangen?</h3>
        {emailSubmitted ? (
          <p className="text-sm text-green-700 text-center">
            Dankjewel! We gebruiken je e-mailadres om later foto&apos;s van jou te delen.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmitEmail}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">E-mailadres (optioneel)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="jij@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark focus:border-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Hoe herken je jou op de foto? (optioneel)</label>
              <textarea
                value={selfDescription}
                onChange={(e) => onSelfDescriptionChange(e.target.value)}
                placeholder="Bijvoorbeeld: Rick, blauwe jurk, bril"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding transition-colors"
            >
              Verstuur
            </button>
            <p className="text-xs text-gray-500 text-center">We gebruiken je gegevens alleen om foto&apos;s met jou te delen.</p>
          </form>
        )}
      </section>
    </div>
  );
}

export default function WeddingPhotoPage() {
  const [step, setStep] = useState<Step>("onboarding");
  const [sessionId, setSessionId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const promptsForSession = useMemo(() => shuffleArray(PROMPTS).slice(0, 10), []);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const currentPrompt = promptsForSession[currentIndex];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
    e.target.value = "";
  }

  async function handleUpload() {
    if (!selectedFile || !currentPrompt) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sessionId", sessionId);
      formData.append("promptId", currentPrompt.id);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload mislukt");
      setSelectedFile(null);
      if (currentIndex + 1 >= promptsForSession.length) setStep("finished");
      else setCurrentIndex((i) => i + 1);
    } catch {
      setUploadError("Er ging iets mis bij het uploaden. Probeer het nog een keer.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      try {
        const res = await fetch("/api/register-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, email: email.trim(), selfDescription }),
        });
        if (!res.ok) throw new Error("error");
      } catch {
        // optional: toast
      }
    }
    setEmailSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-wedding-light flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md">
        {step === "onboarding" && <OnboardingCard onStart={() => setStep("taking")} />}
        {step === "taking" && currentPrompt && (
          <PromptFlow
            prompt={currentPrompt}
            currentIndex={currentIndex}
            total={promptsForSession.length}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadError={uploadError}
          />
        )}
        {step === "finished" && (
          <FinishedScreen
            email={email}
            selfDescription={selfDescription}
            onEmailChange={setEmail}
            onSelfDescriptionChange={setSelfDescription}
            onSubmitEmail={handleSubmitEmail}
            emailSubmitted={emailSubmitted}
          />
        )}
      </div>
    </main>
  );
}

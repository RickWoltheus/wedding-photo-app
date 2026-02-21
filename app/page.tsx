"use client";

import { Sun, Crosshair, Brush, Smartphone, Images, ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Stack from "./components/Stack";

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

type Step = "onboarding" | "tips" | "taking" | "finished";

const TIP_ICONS = {
  light: Sun,
  focus: Crosshair,
  lens: Brush,
  hands: Smartphone,
};

const TIPS: { key: keyof typeof TIP_ICONS; text: string }[] = [
  { key: "light", text: "Zorg voor licht van voren (niet met een raam recht achter iemand)." },
  { key: "focus", text: "Tik op het gezicht op je scherm om scherp te stellen." },
  { key: "lens", text: "Houd je lens even schoon met je trui of doekje." },
  { key: "hands", text: "Houd je telefoon met twee handen voor een stabiele foto." },
];

function OnboardingCard({ onNext }: { onNext: () => void }) {
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
      <button
        type="button"
        onClick={onNext}
        className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding transition-colors"
      >
        Volgende
      </button>
    </div>
  );
}

function TipsScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="text-center space-y-1">
        <p className="text-sm font-medium text-wedding-dark uppercase tracking-wide">Tips</p>
        <h2 className="text-xl font-semibold text-gray-900">Mooie telefoonfoto&apos;s</h2>
      </header>
      <ul className="space-y-4">
        {TIPS.map(({ key, text }) => {
          const Icon = TIP_ICONS[key];
          return (
            <li key={key} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-wedding-light text-wedding-dark flex items-center justify-center p-3">
                <Icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-700 pt-2 flex-1">{text}</p>
            </li>
          );
        })}
      </ul>
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

function PhotoStack({
  prompts,
  previews,
  onClose,
  isModal,
}: {
  prompts: Prompt[];
  previews: (string | null)[];
  onClose?: () => void;
  isModal?: boolean;
}) {
  const cards = useMemo(() => {
    const n = prompts.length;
    return prompts.map((_, reverseI) => {
      const i = n - 1 - reverseI;
      const prompt = prompts[i];
      const url = previews[i];
      if (url) {
        return (
          <img
            key={i}
            src={url}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
          />
        );
      }
      return (
        <div
          key={i}
          className="w-full h-full flex flex-col items-center justify-center p-6 bg-wedding-light text-gray-600 text-center"
        >
          <p className="text-sm font-medium text-wedding-dark">{prompt.title}</p>
          <p className="text-xs mt-1">{prompt.description}</p>
        </div>
      );
    });
  }, [prompts, previews]);

  return (
    <div className="relative w-full" style={{ paddingTop: "100%", maxHeight: isModal ? "70vh" : undefined }}>
      <div className="absolute inset-0 mx-auto flex items-center justify-center" style={{ maxWidth: 280 }}>
        <div className="w-full h-full min-h-[280px]" style={{ width: 208, height: 280 }}>
          <Stack
            randomRotation={false}
            sensitivity={200}
            sendToBackOnClick
            cards={cards}
            autoplay={false}
            autoplayDelay={3000}
            pauseOnHover={false}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 mt-3 text-wedding-dark">
        <ChevronLeft className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-medium">Sleep of tik om door je foto&apos;s te bladeren</span>
      </div>
      {isModal && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Sluiten
        </button>
      )}
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
  onOpenStack,
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
  onOpenStack: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-wedding-dark uppercase tracking-wide">
              Opdracht {currentIndex + 1} van {total}
            </p>
            <h2 className="text-xl font-semibold text-gray-900">{prompt.title}</h2>
            <p className="text-sm text-gray-700">{prompt.description}</p>
          </div>
          <button
            type="button"
            onClick={onOpenStack}
            className="flex-shrink-0 p-2 rounded-xl bg-wedding-light text-wedding-dark hover:bg-wedding transition-colors"
            title="Bekijk foto's"
          >
            <Images className="w-5 h-5" />
          </button>
        </div>
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
  prompts,
  previews,
  email,
  selfDescription,
  onEmailChange,
  onSelfDescriptionChange,
  onSubmitEmail,
  emailSubmitted,
  onOpenStack,
}: {
  prompts: Prompt[];
  previews: (string | null)[];
  email: string;
  selfDescription: string;
  onEmailChange: (v: string) => void;
  onSelfDescriptionChange: (v: string) => void;
  onSubmitEmail: (e: React.FormEvent) => void;
  emailSubmitted: boolean;
  onOpenStack: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Dankjewel voor je foto&apos;s!</h2>
        <p className="text-sm text-gray-700">
          Jij hebt meegeholpen om onze dag vast te leggen. Dat waarderen we enorm.
        </p>
      </header>
      <section>
        <PhotoStack prompts={prompts} previews={previews} />
        <button
          type="button"
          onClick={onOpenStack}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-wedding text-wedding-dark text-sm font-medium hover:bg-wedding-light"
        >
          <Images className="w-4 h-4" />
          Alle foto&apos;s bekijken
        </button>
      </section>
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
  const [uploadedPreviews, setUploadedPreviews] = useState<(string | null)[]>([]);
  const [stackModalOpen, setStackModalOpen] = useState(false);
  const storedUrlsRef = useRef<string[]>([]);

  const promptsForSession = useMemo(() => shuffleArray(PROMPTS).slice(0, 10), []);

  useEffect(() => {
    setUploadedPreviews((prev) => (prev.length === promptsForSession.length ? prev : new Array(promptsForSession.length).fill(null)));
  }, [promptsForSession.length]);

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

  useEffect(() => {
    return () => {
      storedUrlsRef.current.forEach(URL.revokeObjectURL);
      storedUrlsRef.current = [];
    };
  }, []);

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
    const fileToStore = selectedFile;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sessionId", sessionId);
      formData.append("promptId", currentPrompt.id);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload mislukt");
      const url = URL.createObjectURL(fileToStore);
      storedUrlsRef.current.push(url);
      setUploadedPreviews((prev) => {
        const next = [...prev];
        if (next.length !== promptsForSession.length) return next;
        next[currentIndex] = url;
        return next;
      });
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
        {step === "onboarding" && <OnboardingCard onNext={() => setStep("tips")} />}
        {step === "tips" && <TipsScreen onStart={() => setStep("taking")} />}
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
            onOpenStack={() => setStackModalOpen(true)}
          />
        )}
        {step === "finished" && (
          <FinishedScreen
            prompts={promptsForSession}
            previews={uploadedPreviews.length === promptsForSession.length ? uploadedPreviews : new Array(promptsForSession.length).fill(null)}
            email={email}
            selfDescription={selfDescription}
            onEmailChange={setEmail}
            onSelfDescriptionChange={setSelfDescription}
            onSubmitEmail={handleSubmitEmail}
            emailSubmitted={emailSubmitted}
            onOpenStack={() => setStackModalOpen(true)}
          />
        )}
      </div>
      {stackModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setStackModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Jouw foto&apos;s</h3>
            <PhotoStack
              prompts={promptsForSession}
              previews={uploadedPreviews.length === promptsForSession.length ? uploadedPreviews : new Array(promptsForSession.length).fill(null)}
              isModal
              onClose={() => setStackModalOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}

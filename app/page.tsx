"use client";

import { Focus, Hand, RotateCcw, Sparkles, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useNextStep } from "nextstepjs";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Stack from "./components/Stack";

type Prompt = {
  id: string;
  title: string;
  description: string;
};

const PROMPTS: Prompt[] = [
  {
    id: "couple-wide",
    title: "Foto van ons samen",
    description:
      "Maak een foto van ons (het bruidspaar) vanaf de plek waar je nu staat.",
  },
  // {
  //   id: "laughing-guest",
  //   title: "Iemand die lacht",
  //   description:
  //     "Maak een spontane foto van iemand die hardop lacht of een grote glimlach heeft.",
  // },
  // {
  //   id: "venue-wide",
  //   title: "De locatie",
  //   description:
  //     "Maak een overzichtsfoto van de trouwlocatie of de ruimte waar je nu bent.",
  // },
  // {
  //   id: "details",
  //   title: "Een mooi detail",
  //   description:
  //     "Zoom in op een detail dat jij mooi vindt (bloemen, ringen, decoratie, etc.).",
  // },
  // {
  //   id: "table",
  //   title: "Jouw tafel",
  //   description:
  //     "Maak een foto van jouw tafel (alle mensen aan je tafel mogen erop).",
  // },
  // {
  //   id: "dancefloor",
  //   title: "Dansvloer",
  //   description: "Maak een foto van de dansvloer of mensen die dansen.",
  // },
  // {
  //   id: "selfie-new",
  //   title: "Selfie met iemand nieuws",
  //   description:
  //     "Maak een selfie met iemand die je vandaag voor het eerst hebt ontmoet.",
  // },
  // {
  //   id: "candid-couple",
  //   title: "Onopvallende foto van ons",
  //   description:
  //     "Maak een foto van ons zonder dat we er speciaal voor poseren (als dat lukt).",
  // },
];

const STACK_CARD_WIDTH = 268;
const STACK_CARD_HEIGHT = 322; // real polaroid ~89x107mm ratio
const STACK_MAX_WIDTH = 320;
const POLAROID_PADDING = { top: 12, sides: 12, bottom: 28 };
const PREVIEW_PEEK_PCT = 0.2;
const STACK_SENSITIVITY = 200;
const PRINT_SPRING_STIFFNESS = 120;
const PRINT_SPRING_DAMPING = 18;
const PREVIEW_PEEK_SPRING_STIFFNESS = 300;
const PREVIEW_PEEK_SPRING_DAMPING = 30;

function PolaroidFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full bg-white ${className}`}
      style={{
        padding: `${POLAROID_PADDING.top}px ${POLAROID_PADDING.sides}px ${POLAROID_PADDING.bottom}px`,
        boxSizing: "border-box",
      }}
    >
      <div className="w-full h-full min-h-0 rounded-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

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

function TwoHandsIcon({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center gap-0.5 ${className ?? ""}`}>
      <Hand className="w-[48%] h-full" strokeWidth={1.5} />
      <Hand className="w-[48%] h-full scale-x-[-1]" strokeWidth={1.5} />
    </span>
  );
}

const TIP_ICONS = {
  light: Sun,
  focus: Focus,
  lens: Sparkles,
  hands: TwoHandsIcon,
};

const TIPS: { key: keyof typeof TIP_ICONS; text: string }[] = [
  {
    key: "light",
    text: "Zorg voor licht van voren (niet met een raam recht achter iemand).",
  },
  {
    key: "focus",
    text: "Tik op het gezicht op je scherm om scherp te stellen.",
  },
  { key: "lens", text: "Houd je lens even schoon met je trui of doekje." },
  {
    key: "hands",
    text: "Houd je telefoon met twee handen voor een stabiele foto.",
  },
];

function OnboardingCard({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-lg border-2 border-gray-200/80 p-8 space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-wedding-dark uppercase tracking-wide">
          Onze bruiloft
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">
          Help ons de dag vast te leggen
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-prose">
          We hebben geen officiële fotograaf. Jij kunt ons helpen door een paar
          speciale foto&apos;s te maken met je telefoon.
        </p>
        <p className="text-xs text-gray-500 pt-1">
          Dit appje is door <strong>Rick</strong> gebouwd voor onze bruiloft.
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Hoe werkt het?</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 max-w-prose">
          <li>Je krijgt maximaal 10 korte &quot;foto-opdrachten&quot;.</li>
          <li>Maak een foto per opdracht en upload deze direct.</li>
          <li>Daarna zie je de volgende opdracht, totdat je klaar bent.</li>
        </ul>
      </section>
      <button
        type="button"
        onClick={onNext}
        className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3.5 text-sm font-semibold hover:bg-wedding transition-colors"
      >
        Volgende
      </button>
    </div>
  );
}

function TipsScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-xl border-2 border-gray-200/80 p-8 space-y-6">
      <header className="text-center space-y-2">
        <p className="text-sm font-medium text-wedding-dark uppercase tracking-wide">
          Tips
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Mooie telefoonfoto&apos;s
        </h2>
      </header>
      <ul className="grid sm:grid-cols-2 gap-4">
        {TIPS.map(({ key, text }) => {
          const Icon = TIP_ICONS[key];
          return (
            <li key={key} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-wedding-light text-wedding-dark flex items-center justify-center p-2.5 sm:p-3">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-700 pt-1.5 sm:pt-2 flex-1">{text}</p>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onStart}
        className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3.5 text-sm font-semibold hover:bg-wedding transition-colors"
      >
        Start met foto&apos;s maken
      </button>
      <p className="text-xs text-gray-500 text-center">
        Door verder te gaan, geef je toestemming om de foto&apos;s met ons te
        delen.
      </p>
    </div>
  );
}

function PhotoStack({
  printedUrls,
  onCardClick,
}: {
  printedUrls: string[];
  onCardClick?: (photoIndex: number) => void;
}) {
  const { cards, cardIndices } = useMemo(() => {
    const cards = printedUrls.map((url, i) => (
      <PolaroidFrame key={i}>
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
        />
      </PolaroidFrame>
    ));
    return { cards, cardIndices: cards.map((_, i) => i) };
  }, [printedUrls]);

  return (
    <div className="relative w-full">
      <div
        className="mx-auto flex items-center justify-center"
        style={{ maxWidth: STACK_MAX_WIDTH }}
      >
        <div
          className="w-full"
          style={{ width: STACK_CARD_WIDTH, height: STACK_CARD_HEIGHT }}
        >
          <Stack
            randomRotation={false}
            sensitivity={STACK_SENSITIVITY}
            sendToBackOnClick={!onCardClick}
            cards={cards}
            cardIndices={cardIndices}
            interactive={true}
            onCardClick={onCardClick}
            autoplay={false}
            pauseOnHover={false}
          />
        </div>
      </div>
    </div>
  );
}

function FlashOverlay({
  flashOriginRef,
}: {
  flashOriginRef: React.RefObject<HTMLDivElement>;
}) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = flashOriginRef.current;
    if (!el) {
      setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      return;
    }
    const r = el.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, [flashOriginRef]);

  return (
    <>
      {origin && (
        <motion.div
          className="fixed z-[100] pointer-events-none rounded-full bg-white"
          style={{
            left: origin.x,
            top: origin.y,
            width: 24,
            height: 24,
            x: "-50%",
            y: "-50%",
          }}
          initial={{ scale: 0, opacity: 0.95 }}
          animate={{ scale: 8, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      )}
      <motion.div
        className="fixed inset-0 z-[99] pointer-events-none bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, times: [0, 0.2, 1], ease: "easeOut" }}
      />
    </>
  );
}

function PrintDropAnimation({
  url,
  onComplete,
  wrapperRef,
  cardRef,
  stackRef,
}: {
  url: string;
  onComplete: () => void;
  wrapperRef: React.RefObject<HTMLElement | null>;
  cardRef: React.RefObject<HTMLDivElement | null>;
  stackRef: React.RefObject<HTMLElement | null>;
}) {
  const [layout, setLayout] = useState<{
    top: number;
    left: number;
    endTop: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!wrapperRef.current || !cardRef.current || !stackRef.current) return;
    const wr = wrapperRef.current.getBoundingClientRect();
    const cr = cardRef.current.getBoundingClientRect();
    const sr = stackRef.current.getBoundingClientRect();
    setLayout({
      top: cr.top - wr.top,
      left: cr.left - wr.left + (cr.width - STACK_CARD_WIDTH) / 2,
      endTop: sr.top - wr.top,
      width: STACK_CARD_WIDTH,
    });
  }, [url, wrapperRef, cardRef, stackRef]);

  if (!layout) return null;

  return (
    <motion.div
      className="absolute z-[5] rounded-2xl overflow-visible shadow-xl pointer-events-none bg-white"
      style={{
        width: layout.width,
        height: STACK_CARD_HEIGHT,
        left: layout.left,
        top: layout.top,
        padding: `${POLAROID_PADDING.top}px ${POLAROID_PADDING.sides}px ${POLAROID_PADDING.bottom}px`,
        boxSizing: "border-box",
      }}
      initial={{ opacity: 0.95, scale: 0.98 }}
      animate={{
        top: layout.endTop,
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: PRINT_SPRING_STIFFNESS,
        damping: PRINT_SPRING_DAMPING,
      }}
      onAnimationComplete={onComplete}
    >
      <div className="w-full h-full min-h-0 rounded-sm overflow-hidden">
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    </motion.div>
  );
}

function PromptFlow({
  currentIndex,
  total,
  assignmentTitle,
  assignmentDescription,
  selectedFile,
  onFileChange,
  onUpload,
  onResetPhoto,
  isUploading,
  uploadError,
  flashOriginRef,
}: {
  currentIndex: number;
  total: number;
  assignmentTitle: string;
  assignmentDescription: string;
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onResetPhoto?: () => void;
  isUploading: boolean;
  uploadError: string | null;
  flashOriginRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative z-10 w-full max-w-[280px] mx-auto">
      {/* Instax-style camera body */}
      <div className="rounded-[2rem] bg-gradient-to-b from-white to-gray-100 shadow-xl border-2 border-gray-200/80 overflow-hidden">
        {/* Top: lens + viewfinder (flash origin) */}
        <div className="pt-6 pb-2 px-6 flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner flex items-center justify-center ring-4 ring-gray-400/50">
              <div className="w-10 h-10 rounded-full bg-gray-900/80" />
            </div>
            <div
              ref={flashOriginRef}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-600 shadow"
              title="viewfinder"
            />
          </div>
        </div>
        {/* Label strip (like instax film area) */}
        <div className="px-4 py-2 bg-wedding-light border-y border-gray-200/60">
          <p className="text-[10px] font-semibold text-wedding-dark uppercase tracking-widest text-center">
            Opdracht {currentIndex + 1} van {total}
          </p>
        </div>
        {/* Assignment on body */}
        <div
          id="onboarding-assignment"
          className="px-5 py-4 text-center space-y-1 min-h-[72px]"
        >
          <p className="text-sm font-semibold text-gray-900">
            {assignmentTitle}
          </p>
          <p className="text-xs text-gray-600 leading-snug">
            {assignmentDescription}
          </p>
        </div>
        {/* Photo exit slot + shutter button — fixed height so layout doesn't shift */}
        <div className="px-5 pb-5 pt-2">
          <div
            id="onboarding-maak-foto"
            className="rounded-xl bg-gray-800/90 py-3 px-4 border-2 border-gray-700 shadow-inner min-h-[88px] flex flex-col items-center justify-center"
          >
            {selectedFile ? (
              <div className="w-full flex items-center justify-center gap-2">
                {onResetPhoto && (
                  <button
                    type="button"
                    onClick={onResetPhoto}
                    disabled={isUploading}
                    className="flex-shrink-0 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 transition-colors"
                    title="Foto opnieuw nemen"
                    aria-label="Foto opnieuw nemen"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={isUploading}
                  className="flex-1 min-w-0 inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-wedding transition-colors"
                >
                  {isUploading ? "Uploaden..." : "Upload en print"}
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full min-h-[52px]">
                <span className="inline-flex items-center justify-center rounded-full bg-white text-gray-900 w-14 h-14 text-sm font-semibold shadow-md hover:bg-gray-100 active:scale-95 transition-all border-2 border-gray-200 text-center">
                  Maak foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-600 text-center mt-2">
              {uploadError}
            </p>
          )}
          <p className="text-[10px] text-gray-500 text-center mt-3">
            Geen zin meer? Sluit het scherm.
          </p>
        </div>
      </div>
    </div>
  );
}

const FINISHED_CARD_HEIGHT = 400;

function FinishedScreen({
  printedUrls,
  email,
  selfDescription,
  onEmailChange,
  onSelfDescriptionChange,
  onSubmitEmail,
  emailSubmitted,
  onPolaroidClick,
  emailFormStep,
  onEmailFormStepNext,
}: {
  printedUrls: string[];
  email: string;
  selfDescription: string;
  onEmailChange: (v: string) => void;
  onSelfDescriptionChange: (v: string) => void;
  onSubmitEmail: (e: React.FormEvent) => void;
  emailSubmitted: boolean;
  onPolaroidClick?: (photoIndex: number) => void;
  emailFormStep: 1 | 2;
  onEmailFormStepNext: () => void;
}) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
      <div
        className="w-full bg-white rounded-[2rem] shadow-xl border-2 border-gray-200/80 overflow-hidden flex flex-col flex-shrink-0"
        style={{
          height: FINISHED_CARD_HEIGHT,
          maxHeight: FINISHED_CARD_HEIGHT,
        }}
      >
        <div className="p-6 sm:p-8 flex flex-col h-full min-h-0 overflow-y-auto">
          <header className="space-y-2 text-center flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Dankjewel voor je foto&apos;s!
            </h2>
            <p className="text-sm text-gray-700">
              Jij hebt meegeholpen om onze dag vast te leggen.
            </p>
          </header>
          <section className="flex-1 flex flex-col min-h-0 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 text-center flex-shrink-0">
              Foto&apos;s van jezelf ontvangen?
            </h3>
            {emailSubmitted ? (
              <div className="space-y-4 pt-3 flex-1 flex flex-col max-w-prose mx-auto text-center">
                <p className="text-sm text-green-700">
                  Dankjewel! We gebruiken je gegevens om later foto&apos;s met
                  jou te delen.
                </p>
                <div className="text-xs text-gray-600 pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-700 mb-1">
                    Ook zo&apos;n app voor jouw bruiloft of event?
                  </p>
                  <p>
                    Neem contact op met Rick, dan bouwt hij het appje om naar
                    jouw style.
                  </p>
                </div>
              </div>
            ) : emailFormStep === 1 ? (
              <form
                className="flex-1 flex flex-col justify-between min-h-0 pt-4 max-w-sm mx-auto w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  onEmailFormStepNext();
                }}
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    E-mailadres (optioneel)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="jij@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding transition-colors mt-3"
                >
                  Volgende
                </button>
              </form>
            ) : (
              <form
                className="flex-1 flex flex-col justify-between min-h-0 pt-4 max-w-sm mx-auto w-full"
                onSubmit={onSubmitEmail}
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Hoe herken je jou op de foto? (optioneel)
                  </label>
                  <input
                    type="text"
                    value={selfDescription}
                    onChange={(e) => onSelfDescriptionChange(e.target.value)}
                    placeholder="Bijv. Rick, blauwe jurk, bril"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding transition-colors"
                  >
                    Verstuur
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    Alleen om foto&apos;s met jou te delen.
                  </p>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
      <section className="w-full flex justify-center">
        <PhotoStack printedUrls={printedUrls} onCardClick={onPolaroidClick} />
      </section>
    </div>
  );
}

function AccessGateScreen({
  onCodeSubmit,
  error,
}: {
  onCodeSubmit: (code: string) => void;
  error: string | null;
}) {
  const [code, setCode] = useState("");
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-xl border-2 border-gray-200/80 p-8 text-center space-y-5">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Scan de QR-code</h2>
      <p className="text-sm text-gray-700 max-w-prose mx-auto">
        Scan de QR-code op de trouwlocatie om toegang te krijgen.
      </p>
      <p className="text-xs text-gray-600">Of voer de code in:</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCodeSubmit(code.trim());
        }}
        className="space-y-3 max-w-xs mx-auto"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Toegangscode"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark"
          autoComplete="off"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-wedding-dark text-white py-3 text-sm font-semibold hover:bg-wedding"
        >
          Doorgaan
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function WeddingPhotoPage() {
  const searchParams = useSearchParams();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
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
  const [emailFormStep, setEmailFormStep] = useState<1 | 2>(1);
  const [printedUrls, setPrintedUrls] = useState<string[]>([]);
  const [printingPhoto, setPrintingPhoto] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const takingSectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const flashOriginRef = useRef<HTMLDivElement>(null);
  const storedUrlsRef = useRef<string[]>([]);
  const takingTourShownRef = useRef(false);
  const stackTourShownRef = useRef(false);
  const previewTourShownRef = useRef(false);
  const { startNextStep } = useNextStep();

  const promptsForSession = useMemo(
    () => shuffleArray(PROMPTS).slice(0, 10),
    [],
  );

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeFromUrl }),
      })
        .then((r) => {
          if (r.ok) {
            setHasAccess(true);
            window.history.replaceState({}, "", window.location.pathname);
          } else setHasAccess(false);
        })
        .catch(() => setHasAccess(false))
        .finally(() => setAccessChecked(true));
      return;
    }
    fetch("/api/access")
      .then((r) => r.json())
      .then((data) => {
        setHasAccess(data.ok === true);
        setAccessChecked(true);
      })
      .catch(() => {
        setHasAccess(false);
        setAccessChecked(true);
      });
  }, [searchParams]);

  async function handleAccessCodeSubmit(code: string) {
    setAccessError(null);
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setHasAccess(true);
    else
      setAccessError(
        data.error === "Invalid code" ? "Ongeldige code" : "Er ging iets mis",
      );
  }

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
      setFlash(true);
      setSelectedFile(file);
      setUploadError(null);
    }
    e.target.value = "";
  }

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 450);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (step !== "taking" || takingTourShownRef.current) return;
    takingTourShownRef.current = true;
    const t = setTimeout(() => startNextStep("takingTour"), 400);
    return () => clearTimeout(t);
  }, [step, startNextStep]);

  useEffect(() => {
    if (
      step !== "taking" ||
      printedUrls.length < 2 ||
      stackTourShownRef.current
    )
      return;
    stackTourShownRef.current = true;
    const t = setTimeout(() => startNextStep("stackTour"), 500);
    return () => clearTimeout(t);
  }, [step, printedUrls.length, startNextStep]);

  useEffect(() => {
    if (!selectedFile || previewTourShownRef.current) return;
    previewTourShownRef.current = true;
    const t = setTimeout(() => startNextStep("previewTour"), 600);
    return () => clearTimeout(t);
  }, [selectedFile, startNextStep]);

  const handlePrintComplete = useCallback(() => {
    if (!printingPhoto) return;
    setPrintedUrls((prev) => [...prev, printingPhoto]);
    setPrintingPhoto(null);
    if (currentIndex + 1 >= promptsForSession.length) setStep("finished");
    else setCurrentIndex((i) => i + 1);
  }, [printingPhoto, currentIndex, promptsForSession.length]);

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
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload mislukt");
      const url = URL.createObjectURL(fileToStore);
      storedUrlsRef.current.push(url);
      setSelectedFile(null);
      setPrintingPhoto(url);
    } catch {
      setUploadError(
        "Er ging iets mis bij het uploaden. Probeer het nog een keer.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim() || selfDescription.trim()) {
      try {
        const res = await fetch("/api/register-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            email: email.trim(),
            selfDescription: selfDescription.trim(),
          }),
        });
        if (!res.ok) throw new Error("error");
      } catch {
        // optional: toast
      }
    }
    setEmailSubmitted(true);
  }

  if (!accessChecked) {
    return (
      <main className="main-page bg-wedding-light min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-wedding-dark border-t-transparent animate-spin" />
          <span className="text-sm text-gray-600">Laden...</span>
        </div>
      </main>
    );
  }
  if (!hasAccess) {
    return (
      <main className="main-page bg-wedding-light min-h-screen flex flex-col items-center justify-center px-4">
        <AccessGateScreen
          onCodeSubmit={handleAccessCodeSubmit}
          error={accessError}
        />
      </main>
    );
  }

  return (
    <main className="main-page bg-wedding-light flex flex-col items-center px-4 overflow-x-hidden">
      <div className="scale-down-content w-full max-w-md space-y-6 flex flex-col items-center">
        {step === "onboarding" && (
          <OnboardingCard onNext={() => setStep("tips")} />
        )}
        {step === "tips" && <TipsScreen onStart={() => setStep("taking")} />}
        {step === "taking" && currentPrompt && (
          <div ref={takingSectionRef} className="relative space-y-6">
            {/* Full-screen flash: burst from camera then full white, animate back */}
            {flash && <FlashOverlay flashOriginRef={flashOriginRef} />}
            <div className="absolute left-0 top-0 w-0 h-0 overflow-visible pointer-events-none">
              {printingPhoto && (
                <PrintDropAnimation
                  url={printingPhoto}
                  onComplete={handlePrintComplete}
                  wrapperRef={takingSectionRef}
                  cardRef={cardRef}
                  stackRef={stackRef}
                />
              )}
            </div>
            <div ref={cardRef} className="relative z-10">
              <PromptFlow
                currentIndex={currentIndex}
                total={promptsForSession.length}
                assignmentTitle={currentPrompt.title}
                assignmentDescription={currentPrompt.description}
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
                onResetPhoto={() => setSelectedFile(null)}
                isUploading={isUploading}
                uploadError={uploadError}
                flashOriginRef={flashOriginRef}
              />
              {selectedFile && previewUrl && (
                <>
                  <motion.div
                    id="onboarding-preview"
                    className="absolute left-1/2 top-full overflow-visible cursor-pointer -translate-x-1/2"
                    style={{
                      width: STACK_CARD_WIDTH,
                      height: STACK_CARD_HEIGHT,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: STACK_CARD_HEIGHT * PREVIEW_PEEK_PCT }}
                    transition={{
                      type: "spring",
                      stiffness: PREVIEW_PEEK_SPRING_STIFFNESS,
                      damping: PREVIEW_PEEK_SPRING_DAMPING,
                    }}
                    onClick={() => {
                      setLightboxSlides([{ src: previewUrl }]);
                      setLightboxIndex(0);
                      setLightboxOpen(true);
                    }}
                  >
                    <div
                      className="absolute left-0 bottom-0 rounded-2xl overflow-hidden shadow-xl bg-white box-border"
                      style={{
                        width: STACK_CARD_WIDTH,
                        height: STACK_CARD_HEIGHT,
                        padding: `${POLAROID_PADDING.top}px ${POLAROID_PADDING.sides}px ${POLAROID_PADDING.bottom}px`,
                      }}
                    >
                      <div className="w-full h-full min-h-0 rounded-sm overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover object-bottom"
                        />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
            <div id="onboarding-stack" ref={stackRef}>
              <PhotoStack
                printedUrls={printedUrls}
                onCardClick={(photoIndex) => {
                  setLightboxSlides(printedUrls.map((src) => ({ src })));
                  setLightboxIndex(photoIndex);
                  setLightboxOpen(true);
                }}
              />
            </div>
          </div>
        )}
        {step === "finished" && (
          <FinishedScreen
            printedUrls={printedUrls}
            email={email}
            selfDescription={selfDescription}
            onEmailChange={setEmail}
            onSelfDescriptionChange={setSelfDescription}
            onSubmitEmail={handleSubmitEmail}
            emailSubmitted={emailSubmitted}
            emailFormStep={emailFormStep}
            onEmailFormStepNext={() => setEmailFormStep(2)}
            onPolaroidClick={(photoIndex) => {
              setLightboxSlides(printedUrls.map((src) => ({ src })));
              setLightboxIndex(photoIndex);
              setLightboxOpen(true);
            }}
          />
        )}
      </div>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="main-page bg-wedding-light min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-wedding-dark border-t-transparent animate-spin" />
            <span className="text-sm text-gray-600">Laden...</span>
          </div>
        </main>
      }
    >
      <WeddingPhotoPage />
    </Suspense>
  );
}

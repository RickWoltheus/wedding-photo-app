"use client";

import { useEffect, useState } from "react";

export default function QrPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/qr-auth")
      .then((r) => r.json())
      .then((data) => setAuthed(data.ok === true))
      .catch(() => setAuthed(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/qr-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setAuthed(true);
    else setError(data.error === "Invalid password" ? "Ongeldig wachtwoord" : "Fout");
  }

  if (authed === null) {
    return (
      <main className="min-h-screen bg-wedding-light flex items-center justify-center">
        <p className="text-sm text-gray-500">Laden...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-wedding-light flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xs bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900 text-center">
            QR-code bekijken
          </h1>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-dark"
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-wedding-dark text-white py-2.5 text-sm font-semibold hover:bg-wedding"
            >
              Inloggen
            </button>
          </form>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>
      </main>
    );
  }

  const qrUrl = "/api/qr-image";
  return (
    <main className="min-h-screen bg-wedding-light flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">QR-code voor gasten</h1>
        <p className="text-sm text-gray-600">
          Laat gasten deze code scannen om de fotostream te openen.
        </p>
        <img
          src={qrUrl}
          alt="QR code"
          className="mx-auto w-64 h-64 object-contain bg-white rounded-lg"
        />
        <a
          href={qrUrl}
          download="wedding-photo-qr.png"
          className="inline-block rounded-full bg-wedding-dark text-white px-6 py-2.5 text-sm font-semibold hover:bg-wedding"
        >
          Download PNG
        </a>
      </div>
    </main>
  );
}

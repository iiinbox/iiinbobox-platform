"use client";

import { useState } from "react";

export default function AdminGatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/admin/homepage";
        return;
      }
      setError("Incorrect password");
      setPassword("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-72">
        <p className="text-sm font-semibold tracking-widest text-center">ADMIN ACCESS</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="border border-black px-4 py-2 text-sm outline-none"
        />
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white text-sm py-2 font-medium disabled:opacity-50"
        >
          {busy ? "Verifying..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

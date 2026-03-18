"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, X } from "lucide-react";
import { getMySubscription, trialDaysLeft, isSubscriptionActive } from "@/lib/api";
import type { Subscription } from "@/lib/api";

export default function TrialBanner() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getMySubscription().then(setSub).catch(() => {});
  }, []);

  if (dismissed || !sub) return null;
  const days = trialDaysLeft(sub);
  if (sub.status !== "TRIALING" || days <= 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(147,51,234,0.95))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(168,85,247,0.4)",
        boxShadow: "0 0 40px rgba(124,58,237,0.4)",
        maxWidth: 340,
      }}
    >
      <Zap size={18} color="#fff" />
      <div className="flex-1">
        <p className="text-sm font-bold text-white leading-tight">
          {days} {days === 1 ? "dia" : "dias"} de trial restantes
        </p>
        <Link href="/pricing" className="text-xs text-purple-200 hover:text-white transition-colors">
          Assinar agora →
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-purple-300 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

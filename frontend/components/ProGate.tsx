"use client";

import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import type { ReactNode } from "react";

interface ProGateProps {
  /** Whether the user currently has access (isActive || isPro, depending on what you want to gate) */
  hasAccess: boolean;
  loading?: boolean;
  /** Feature label shown in the lock overlay */
  featureName?: string;
  children: ReactNode;
}

/**
 * Wraps any section with a blurred lock overlay when the user doesn't have
 * the required subscription tier. Pass `hasAccess={isActive}` to allow
 * TRIALING users in, or `hasAccess={isPro}` to require a paid plan.
 */
export default function ProGate({
  hasAccess,
  loading = false,
  featureName = "este recurso",
  children,
}: ProGateProps) {
  if (loading) return null;
  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content preview */}
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{
          background: "rgba(7,7,15,0.75)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}
        >
          <Lock size={20} color="#a855f7" />
        </div>
        <p className="text-sm font-semibold text-white text-center px-6">
          Assine um plano Pro para acessar {featureName}
        </p>
        <Link
          href="/pricing"
          className="flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            color: "#fff",
            boxShadow: "0 0 15px rgba(124,58,237,0.4)",
          }}
        >
          <Zap size={14} />
          Ver planos
        </Link>
      </div>
    </div>
  );
}

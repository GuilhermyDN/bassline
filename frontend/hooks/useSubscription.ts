"use client";

import { useEffect, useState } from "react";
import {
  getMySubscription,
  isSubscriptionActive,
  trialDaysLeft,
  type Subscription,
} from "@/lib/api";

export interface SubscriptionState {
  sub: Subscription | null;
  loading: boolean;
  isActive: boolean;       // TRIALING or ACTIVE
  isPro: boolean;          // plan === DJ_PRO or CLUB_PRO
  isExpired: boolean;      // EXPIRED or CANCELED or PAST_DUE (not active, not trialing)
  daysLeft: number;        // trial days remaining
}

export function useSubscription(): SubscriptionState {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySubscription()
      .then(setSub)
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  }, []);

  const isActive = isSubscriptionActive(sub);
  const isPro =
    sub?.plan === "DJ_PRO" || sub?.plan === "CLUB_PRO";
  const isExpired =
    !!sub &&
    !isActive;
  const daysLeft = trialDaysLeft(sub);

  return { sub, loading, isActive, isPro, isExpired, daysLeft };
}

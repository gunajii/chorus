"use client";
import { useEffect } from "react";

// Renders a Google AdSense unit — but only once you've set
// NEXT_PUBLIC_ADSENSE_CLIENT. Until then it renders nothing (no broken boxes).
export default function AdSlot({ slot, className }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  useEffect(() => {
    if (!client) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, [client]);
  if (!client) return null;
  return (
    <div className={"adslot " + (className || "")}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

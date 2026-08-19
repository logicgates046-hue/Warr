"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const side = searchParams.get("side");

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCommunity();
  }, [side]);

  async function loadCommunity() {
    setLoading(true);
    setError("");

    try {
      if (side !== "WANTAM" && side !== "TUTAM") {
        setError("No valid WAR community was selected.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error: communityError } =
        await supabase
          .from("community_settings")
          .select("id, side, whatsapp_url, updated_at")
          .eq("side", side)
          .limit(1)
          .maybeSingle();

      if (communityError) {
        throw communityError;
      }

      if (!data) {
        setError(
          `The ${side} community has not been configured yet.`
        );
        return;
      }

      if (!data.whatsapp_url) {
        setError(
          `The ${side} community link has not been configured yet.`
        );
        return;
      }

      setCommunity(data);
    } catch (err) {
      setError(
        err.message || "Unable to load the community."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="community-page">
        <section className="community-container">
          <p>LOADING COMMUNITY...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="community-page">
        <section className="community-container">

          <p className="eyebrow">WAR COMMUNITY</p>

          <h1>ALMOST THERE.</h1>

          <p className="community-description">
            {error}
          </p>

          <a
            href="/dashboard"
            className="community-secondary-button"
          >
            RETURN TO DASHBOARD
          </a>

        </section>
      </main>
    );
  }

  return (
    <main className="community-page">
      <section className="community-container">

        <p className="eyebrow">
          WAR — {side}
        </p>

        <h1>
          YOU'RE IN.
        </h1>

        <p className="community-description">
          Your Stage 2 vote has been successfully recorded.
          Welcome to the {side} community.
        </p>

        <div className="community-success">

          <span className="community-check">
            ✓
          </span>

          <div>
            <span className="community-label">
              VOTING COMPLETE
            </span>

            <h2>{side}</h2>

            <p>
              Join your community to connect with other
              people who chose {side}.
            </p>
          </div>

        </div>

        <a
          href={community.whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="community-button"
        >
          JOIN {side} COMMUNITY →
        </a>

        <a
          href="/dashboard"
          className="community-secondary-button"
        >
          RETURN TO DASHBOARD
        </a>

      </section>
    </main>
  );
}

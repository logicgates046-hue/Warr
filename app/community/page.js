"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function CommunityContent() {
  const searchParams = useSearchParams();
  const side = searchParams.get("side");

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCommunity();
  }, []);

  async function loadCommunity() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (!side) {
        setError(
          "No community side was specified."
        );
        return;
      }

      const { data, error: communityError } =
        await supabase
          .from("community-settings")
          .select(
            "id, side, whatsapp_url, updated_at"
          )
          .eq("side", side)
          .maybeSingle();

      if (communityError) {
        throw communityError;
      }

      if (!data) {
        setError(
          `No community has been configured for ${side}.`
        );
        return;
      }

      setCommunity(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load the community."
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

          <p className="eyebrow">
            WAR COMMUNITY
          </p>

          <h1>UNAVAILABLE.</h1>

          <p className="community-error">
            {error}
          </p>

          <a
            href="/dashboard"
            className="admin-secondary-button"
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
          WAR COMMUNITY
        </p>

        <h1>
          {community?.side}
          <br />
          COMMUNITY.
        </h1>

        <p className="community-description">
          Stage 2 is complete. You can now join your
          community group.
        </p>

        {community?.whatsapp_url && (
          <a
            href={community.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="community-button"
          >
            JOIN {community.side} COMMUNITY →
          </a>
        )}

        <a
          href="/dashboard"
          className="community-back"
        >
          RETURN TO DASHBOARD
        </a>

      </section>
    </main>
  );
}

function CommunityFallback() {
  return (
    <main className="community-page">
      <section className="community-container">
        <p>LOADING COMMUNITY...</p>
      </section>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityFallback />}>
      <CommunityContent />
    </Suspense>
  );
}

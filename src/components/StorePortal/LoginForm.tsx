"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GUMMY_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/hFK3bZtNMbaPzAzvvjdqbb/portal-gummy-hero-mmXrNC6FgC4VxwvwuQyQ6d.webp";
const ICON_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/hFK3bZtNMbaPzAzvvjdqbb/portal-logo-icon-YNBxLmmfhMnbfMG9NnzYy8.png";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // TODO: wire up login API
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#e8e4c9" }}
    >
      <div
        className="flex overflow-hidden w-full"
        style={{ maxWidth: "1200px", height: "100vh", maxHeight: "700px" }}
      >
        {/* Left panel — form */}
        <div
          className="flex flex-col justify-center w-full lg:max-w-md px-8 lg:px-12 py-12 shrink-0"
          style={{ background: "#fff" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_URL} alt="Better Edibles" className="w-10 h-10 rounded-xl" />
            <div>
              <div
                className="text-lg font-semibold leading-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
              >
                Better Edibles
              </div>
              <div className="text-xs" style={{ color: "#9a8f6e" }}>
                Store Partner Portal
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-3xl font-semibold mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
            >
              Welcome back.
            </h1>
            <p className="text-sm" style={{ color: "#6b6045" }}>
              Sign in to access your store dashboard, assets, and ordering tools.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "#6b6045" }}
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@yourstore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 text-sm"
                style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518" }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: "#6b6045" }}
                >
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs hover:underline"
                  style={{ color: "#c45a1a" }}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 text-sm"
                style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518" }}
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 rounded"
                style={{ background: "#fdf0ec", color: "#c45a1a", border: "1px solid #f0c4a8" }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold mt-2"
              style={{ background: loading ? "#d6a080" : "#c45a1a", color: "white", border: "none" }}
            >
              {loading ? "Signing in…" : "Sign In to Portal"}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-xs text-center" style={{ color: "#9a8f6e" }}>
            Not a partner yet?{" "}
            <button
              type="button"
              onClick={() => router.push("/store-portal")}
              className="hover:underline"
              style={{ color: "#c45a1a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit" }}
            >
              Apply for a wholesale account
            </button>
          </p>
        </div>

        {/* Right panel — hero image (hidden on mobile) */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GUMMY_HERO}
            alt="Better Edibles Premium Gummies"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-12"
            style={{ background: "linear-gradient(to top, rgba(30,24,16,0.72) 0%, transparent 60%)" }}
          >
            <blockquote
              className="text-2xl font-medium leading-snug mb-3"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#f5f0e8" }}
            >
              &ldquo;Your products.<br />Your brand.<br />Your gummy.&rdquo;
            </blockquote>
            <p className="text-sm" style={{ color: "#c8bfa0" }}>
              Oregon-crafted edibles, built for your store.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

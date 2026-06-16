"use client";

import { LoginForm } from "@/components/pages/Login/LoginForm";
import Lottie from "lottie-react";
import loginAnimation from "../../../public/Login.json";

export default function LoginPage() {
  // anywhere safe, e.g. footer text
  console.log("staging deploy test");

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side - Animation placeholder */}
      <div className="hidden lg:flex items-center justify-center bg-linear-to-br from-primary/30 to-secondary/30">
        <div className="text-center text-primary-foreground">
          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xs border border-border/50 shadow-lg flex items-center justify-center">
            <Lottie animationData={loginAnimation} loop={true} />
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

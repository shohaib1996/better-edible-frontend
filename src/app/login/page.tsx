"use client"

import { LoginForm } from "@/src/components/pages/Login/LoginForm"
import Lottie from "lottie-react";
import loginAnimation from "../../../public/Login.json"


export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Animation placeholder */}
      <div className="hidden lg:flex items-center justify-center bg-linear-to-br from-accent/40 to-accent/40">
        <div className="text-center text-primary-foreground">
          <div className=" bg-accent/15 p-5 rounded-2xl flex items-center justify-center">
            <Lottie animationData={loginAnimation} loop={true} />
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

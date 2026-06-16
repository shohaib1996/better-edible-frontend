"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Mail } from "lucide-react";
import {
  useLoginStoreMutation,
  useSendMagicLinkMutation,
  useVerifyMagicLinkMutation,
} from "@/redux/api/StoreAuth/storeAuthApi";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const magicSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type LoginValues = z.infer<typeof loginSchema>;
type MagicValues = z.infer<typeof magicSchema>;

export default function StoreLoginPage() {
  return (
    <Suspense>
      <StoreLoginForm />
    </Suspense>
  );
}

function StoreLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [loginStore, { isLoading: isLoginLoading }] = useLoginStoreMutation();
  const [sendMagicLink, { isLoading: isMagicLoading }] =
    useSendMagicLinkMutation();
  const [verifyMagicLink] = useVerifyMagicLinkMutation();
  const verifyCalledRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || verifyCalledRef.current) return;
    verifyCalledRef.current = true;
    setVerifying(true);
    verifyMagicLink({ token })
      .unwrap()
      .then((result) => {
        localStorage.setItem("better-store-user", JSON.stringify(result.user));
        toast.success(`Welcome back, ${result.user.name}!`);
        router.replace("/store/assets");
      })
      .catch((err) => {
        toast.error(
          err?.data?.message || "Magic link is invalid or has expired",
        );
        setVerifying(false);
      });
  }, []);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicForm = useForm<MagicValues>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
  });

  async function onLoginSubmit(values: LoginValues) {
    try {
      const result = await loginStore({
        ...values,
        email: values.email.toLowerCase().trim(),
      }).unwrap();
      localStorage.setItem("better-store-user", JSON.stringify(result.user));
      toast.success("Welcome back!");
      router.push("/store/assets");
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid email or password");
    }
  }

  async function onMagicSubmit(values: MagicValues) {
    try {
      await sendMagicLink({
        email: values.email.toLowerCase().trim(),
      }).unwrap();
      setMagicSent(true);
      toast.success("Magic link sent — check your email");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send magic link");
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Better Edibles"
            width={80}
            height={80}
            className="rounded-xs"
          />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Better Edibles"
            width={80}
            height={80}
            className="rounded-xs"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold">Store Portal</h1>
            <p className="text-sm text-muted-foreground">Better Edibles</p>
          </div>
        </div>

        <Card className="rounded-xs shadow-lg border border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">
              {magicMode ? "Magic Link Sign In" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {magicMode
                ? "We'll send a sign-in link to your email"
                : "Enter your email and password to continue"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!magicMode ? (
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@yourstore.com"
                            className="rounded-xs"
                            disabled={isLoginLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="rounded-xs"
                              disabled={isLoginLoading}
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full rounded-xs"
                    disabled={isLoginLoading}
                    size="lg"
                  >
                    {isLoginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            ) : magicSent ? (
              <div className="text-center space-y-3 py-2">
                <div className="flex justify-center">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your inbox for a sign-in link. It expires in 15 minutes.
                </p>
                <button
                  onClick={() => {
                    setMagicSent(false);
                    setMagicMode(false);
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <Form key="magic-form" {...magicForm}>
                <form
                  onSubmit={magicForm.handleSubmit(onMagicSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={magicForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@yourstore.com"
                            className="rounded-xs"
                            disabled={isMagicLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full rounded-xs"
                    disabled={isMagicLoading}
                    size="lg"
                  >
                    {isMagicLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>
              </Form>
            )}

            {!magicSent && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setMagicMode(!magicMode);
                    setMagicSent(false);
                    magicForm.reset();
                    loginForm.reset();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  {magicMode
                    ? "Sign in with password instead"
                    : "Sign in with magic link"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

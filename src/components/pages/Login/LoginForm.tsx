"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useLoginAdminMutation } from "@/redux/api/admin/authApi";
import { useLoginRepMutation } from "@/redux/api/RepLogin/repAuthApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [adminLogin, { isLoading: isAdminLoading }] = useLoginAdminMutation();
  const [repLogin, { isLoading: isRepLoading }] = useLoginRepMutation();

  const isLoading = isAdminLoading || isRepLoading;
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      let result;

      try {
        // Try Rep login first
        result = await repLogin(values).unwrap();
        localStorage.setItem(
          "better-user",
          JSON.stringify(result?.rep || result)
        );
        toast.success("Login successful!");
        router.push("/rep");
        return;
      } catch (_) {
        // If rep fails, try admin
        try {
          result = await adminLogin(values).unwrap();
          localStorage.setItem(
            "better-user",
            JSON.stringify(result?.admin || result)
          );
          toast.success("Login successful!");

          const userRole = result?.admin?.role || result?.role;
          if (userRole === "superadmin") router.push("/admin");
          else router.push("/rep");
        } catch (adminError: any) {
          toast.error(adminError?.data?.message || "Invalid email or password");
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "An unexpected error occurred.");
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD WITH EYE TOGGLE */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

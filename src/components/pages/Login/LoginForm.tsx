"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { useLoginAdminMutation } from "@/src/redux/api/admin/authApi"
import { useLoginRepMutation } from "@/src/redux/api/RepLogin/repAuthApi"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {}

export function LoginForm({}: LoginFormProps) {
  const router = useRouter()
  const [adminLogin, { isLoading: isAdminLoading }] = useLoginAdminMutation()
  const [repLogin, { isLoading: isRepLoading }] = useLoginRepMutation()

  const isLoading = isAdminLoading || isRepLoading

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      let result;
      try {
        // First, try to log in as a rep
        result = await repLogin(values).unwrap();
        localStorage.setItem("better-user", JSON.stringify(result?.rep || result));
        toast.success("Login successful!");
        router.push("/rep");
        return;
      } catch (repError) {
        // If rep login fails, try to log in as an admin
        try {
          result = await adminLogin(values).unwrap();
          localStorage.setItem("better-user", JSON.stringify(result?.admin || result));
          toast.success("Login successful!");
          const userRole = result?.admin?.role || result?.role;
          if (userRole === "superadmin") {
            router.push("/admin");
          } else {
            router.push("/rep");
          }
        } catch (adminError: any) {
          // If both logins fail, show an error
          console.error("Login error:", adminError);
          toast.error(adminError?.data?.message || "Invalid email or password");
        }
      }
    } catch (error: any) {
      // This catch block might be redundant now, but we'll keep it for any unexpected errors
      console.error("Login error:", error);
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>


      </CardContent>
    </Card>
  )
}

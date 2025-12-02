"use client";

import { useState } from "react";
import { useUser } from "@/redux/hooks/useAuth";
import {
  useGetRepByIdQuery,
  useResetPasswordMutation,
  useResetPinMutation,
} from "@/redux/api/Rep/repApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const user = useUser();
  const { data: rep, isLoading } = useGetRepByIdQuery(user?.id, {
    skip: !user?.id,
  });

  const [resetPassword, { isLoading: isPasswordLoading }] =
    useResetPasswordMutation();
  const [resetPin, { isLoading: isPinLoading }] = useResetPinMutation();

  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");

  const handlePasswordChange = async () => {
    if (!newPassword) return;
    try {
      await resetPassword({ id: user?.id, password: newPassword }).unwrap();
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update password");
    }
  };

  const handlePinChange = async () => {
    if (!newPin) return;

    // Validate PIN: 4 digits
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits (0-9)");
      return;
    }

    try {
      await resetPin({ id: user?.id, pin: newPin }).unwrap();
      toast.success("PIN updated successfully");
      setNewPin("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update PIN");
    }
  };

  if (isLoading || user === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!rep) {
    return <div>Rep not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Name</Label>
              <div className="font-medium text-lg">{rep.name}</div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Login Name</Label>
              <div className="font-medium">{rep.loginName}</div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Email</Label>
              <div className="font-medium">{rep.email || "N/A"}</div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Phone</Label>
              <div className="font-medium">{rep.phone || "N/A"}</div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Territory</Label>
              <div className="font-medium">{rep.territory || "N/A"}</div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Status</Label>
              <div className="capitalize font-medium">{rep.status}</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Change PIN */}
          <Card>
            <CardHeader>
              <CardTitle>Change PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">New PIN</Label>
                <Input
                  id="pin"
                  type="text"
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePinChange}
                disabled={isPinLoading || !newPin}
                className="w-full"
              >
                {isPinLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update PIN
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isPasswordLoading || !newPassword}
                className="w-full"
              >
                {isPasswordLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

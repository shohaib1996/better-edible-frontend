"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ImageIcon } from "lucide-react";

interface LabelData {
  _id: string;
  flavorName: string;
  productType: string;
  currentStage: string;
  labelImages: Array<{
    url: string;
    secureUrl: string;
  }>;
  storeName: string;
  isAlreadyApproved: boolean;
}

export default function LabelApprovalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [label, setLabel] = useState<LabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  // NEXT_PUBLIC_API_URL already includes /api, so we use it directly
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const response = await fetch(
          `${API_URL}/labels/public/approve/${token}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load label");
          return;
        }

        setLabel(data);
        if (data.isAlreadyApproved) {
          setApproved(true);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLabel();
    }
  }, [token, API_URL]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(
        `${API_URL}/labels/public/approve/${token}`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to approve label");
        return;
      }

      setApproved(true);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading label...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Unable to Load Label
            </h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              This link may have expired or already been used.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Label Approved!
            </h2>
            <p className="text-gray-600">
              Thank you for approving the <strong>{label?.flavorName}</strong>{" "}
              label.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Your Better Edibles rep will be notified and the label will move
              to the next stage.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-amber-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Better Edibles</h1>
          <p className="text-gray-600 mt-2">Label Approval Request</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Review Your Label Design
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Store: {label?.storeName}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Label Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Flavor:</span>
                  <p className="font-semibold">{label?.flavorName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Product Type:</span>
                  <p className="font-semibold">{label?.productType}</p>
                </div>
              </div>
            </div>

            {/* Label Image */}
            <div className="text-center">
              <h3 className="font-medium mb-4">Label Design:</h3>
              {label?.labelImages && label.labelImages.length > 0 ? (
                <div className="relative inline-block">
                  <Image
                    src={
                      label.labelImages[0].secureUrl || label.labelImages[0].url
                    }
                    alt={label.flavorName}
                    width={400}
                    height={400}
                    className="rounded-lg border shadow-md max-w-full h-auto"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Approval Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              >
                {approving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Approve This Label
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-gray-500 mt-3">
                By clicking approve, you confirm this label design is ready for
                production.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Questions? Contact your Better Edibles representative.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadDutiesFormProps {
  retreatId: number;
}

export function UploadDutiesForm({ retreatId }: UploadDutiesFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file || !file.name.endsWith(".csv")) {
      setUploadStatus({
        type: "error",
        message: "Please select a CSV file",
      });
      setIsUploading(false);
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch(
        `/api/admin/retreats/${retreatId}/duties/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUploadStatus({
          type: "success",
          message: `Successfully created ${data.created} duties${
            data.errors ? ` (${data.errors.length} errors)` : ""
          }`,
        });
        // Reset form
        (e.target as HTMLFormElement).reset();
        // Refresh page to show new duties
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setUploadStatus({
          type: "error",
          message: data.error || "Failed to upload CSV",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to upload CSV. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border border-border rounded-lg bg-card space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground mb-2">
          Upload Duties from CSV
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV file with duties. The CSV should have a header row with
          columns for &quot;title&quot; (required) and &quot;description&quot;
          (optional).
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Example CSV format:
          <br />
          <code className="block mt-1 p-2 bg-muted rounded text-xs">
            title,description
            <br />
            Shrine Setup,Set up the meditation shrine before the retreat
            <br />
            Tea Service,Serve tea during breaks
            <br />
            Clean-up,Clean up after the retreat ends
          </code>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            CSV File <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".csv"
            required
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {uploadStatus && (
          <div
            className={`p-3 rounded-md ${
              uploadStatus.type === "success"
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}
          >
            {uploadStatus.message}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </form>
    </div>
  );
}

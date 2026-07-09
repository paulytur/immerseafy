"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, QrCode } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminSettingsPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState(120);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    if (data.settings) {
      setQrUrl(data.settings.qr_pay_image_url);
      setExpiryHours(data.settings.payment_expiry_hours);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setQrUrl(data.qrPayImageUrl);
      setMessage("QR Pay image uploaded.");
    } else {
      setMessage(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function saveExpiry(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentExpiryHours: expiryHours }),
    });

    if (res.ok) setMessage("Settings saved.");
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Payment QR code and booking expiry rules."
      />

      {message && (
        <p className="rounded-lg border border-teal/25 bg-teal/10 px-4 py-3 text-sm text-teal">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
              <QrCode size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-sand">
                QR Pay image
              </h2>
              <p className="text-xs text-sand-muted">
                Shown on the customer payment page
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-sand-muted">
            Upload your QR Ph merchant QR. Customers scan this after you approve
            their booking.
          </p>

          {qrUrl && (
            <div className="mt-5 flex justify-center rounded-lg border border-card-border bg-white p-4">
              <Image
                src={qrUrl}
                alt="QR Pay"
                width={200}
                height={200}
                className="h-48 w-48 object-contain"
                unoptimized
              />
            </div>
          )}

          <label className="btn-secondary mt-5 inline-flex cursor-pointer">
            {uploading ? "Uploading…" : "Upload QR image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        <form onSubmit={saveExpiry} className="admin-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-sand">
                Payment window
              </h2>
              <p className="text-xs text-sand-muted">
                Unpaid bookings expire automatically
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-sand-muted">
            Hours before unpaid bookings expire (default 120 = 5 days).
          </p>

          <div className="mt-5">
            <label className="form-label">Expiry hours</label>
            <input
              type="number"
              min={24}
              max={336}
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="form-input max-w-[8rem]"
            />
          </div>

          <button type="submit" className="btn-primary mt-5">
            Save settings
          </button>
        </form>
      </div>
    </div>
  );
}

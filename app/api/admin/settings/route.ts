import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile, requireStaffProfile } from "@/lib/supabase/auth";

export async function GET() {
  try {
    await requireStaffProfile();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminProfile();
    const body = await request.json();
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.paymentExpiryHours !== undefined) {
      updates.payment_expiry_hours = Number(body.paymentExpiryHours);
    }

    if (body.qrPayImageUrl !== undefined) {
      updates.qr_pay_image_url = body.qrPayImageUrl;
    }

    const { data, error } = await supabase
      .from("site_settings")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminProfile();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `qr-pay.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("payment-assets")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("payment-assets").getPublicUrl(path);

    await supabase
      .from("site_settings")
      .update({
        qr_pay_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return NextResponse.json({ qrPayImageUrl: publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}

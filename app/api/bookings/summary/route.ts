import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBookingSummaryPdfForBooking } from "@/lib/booking-summary";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("ref")?.trim();
    const token = searchParams.get("token")?.trim();

    if (!reference || !token) {
      return NextResponse.json(
        { error: "Missing reference or token" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, session_slots(*)")
      .eq("reference", reference)
      .eq("payment_token", token)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pdfBytes = await generateBookingSummaryPdfForBooking(supabase, booking);
    const filename = `Immerseafy-${reference}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Booking summary PDF failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

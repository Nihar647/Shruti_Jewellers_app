import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = (formData.get("image") || formData.get("pdf")) as File;
    const phone = formData.get("phone") as string;
    const customerName = formData.get("customerName") as string;
    const totalAmount = formData.get("totalAmount") as string;

    if (!imageFile || !phone || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "WhatsApp API not configured" },
        { status: 500 }
      );
    }

    const mimeType = imageFile.type || "image/png";
    const isImage = mimeType.startsWith("image/");

    // Step 1: Upload Image/File to WhatsApp Media API
    const mediaForm = new FormData();
    mediaForm.append("file", imageFile, imageFile.name);
    mediaForm.append("type", mimeType);
    mediaForm.append("messaging_product", "whatsapp");

    const uploadRes = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
        body: mediaForm,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Media upload failed:", err);
      return NextResponse.json(
        { error: "Failed to upload photo to WhatsApp" },
        { status: 500 }
      );
    }

    const { id: mediaId } = await uploadRes.json();

    // Step 2: Send Image/Document message via WhatsApp
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const caption = `Hello ${customerName},\n\nYour bill from *Shruti Jewellers* (GSTIN: BRKPK3023K) has been generated.\n\nTotal Amount: ₹${totalAmount}\n\nThank you for shopping with us!`;

    const messagePayload: any = {
      messaging_product: "whatsapp",
      to: formattedPhone,
    };

    if (isImage) {
      messagePayload.type = "image";
      messagePayload.image = {
        id: mediaId,
        caption: caption,
      };
    } else {
      messagePayload.type = "document";
      messagePayload.document = {
        id: mediaId,
        filename: imageFile.name,
        caption: caption,
      };
    }

    const messageRes = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!messageRes.ok) {
      const err = await messageRes.text();
      console.error("Message send failed:", err);
      let errMsg = "Failed to send WhatsApp message";
      try {
        const parsed = JSON.parse(err);
        if (parsed.error && parsed.error.message) {
          errMsg = parsed.error.message;
        }
      } catch (e) {}
      return NextResponse.json(
        { error: errMsg, details: err },
        { status: 500 }
      );
    }

    const result = await messageRes.json();
    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error: any) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

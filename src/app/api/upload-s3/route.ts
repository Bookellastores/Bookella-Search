import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const { imageUrl, isbn, title } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: "AWS_S3_BUCKET_NAME is not configured" },
        { status: 500 }
      );
    }

    // 1. Download image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image from URL");
    
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";

    // 2. Generate unique filename
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const safeTitle = (title || "book").substring(0, 50).replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `covers/${isbn || "no-isbn"}-${safeTitle}-${Date.now()}.${ext}`;

    // 3. Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

    return NextResponse.json({ url: s3Url, success: true });
  } catch (error: any) {
    console.error("S3 Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

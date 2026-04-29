import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2";

export async function presignUpload(input: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ url: string; key: string; publicUrl: string }> {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  });
  const url = await getSignedUrl(r2, cmd, { expiresIn: input.expiresIn ?? 60 * 5 });
  return { url, key: input.key, publicUrl: `${R2_PUBLIC_URL}/${input.key}` };
}

export async function presignDownload(key: string, expiresIn = 60 * 5): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return await getSignedUrl(r2, cmd, { expiresIn });
}

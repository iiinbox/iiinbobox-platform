import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  CopyObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { RedisService } from "../redis/redis.service";

// Item 3: asset library listing is a hot read (the editor's Assets tab hits
// it constantly while picking images) but MinIO's ListObjectsV2 is a real
// network round-trip each time. Short TTL since uploads should show up
// promptly, backed up by active invalidation in upload() below so a fresh
// upload is visible immediately rather than waiting out the TTL.
const ASSETS_TTL_SECONDS = 60;
const assetsKey = (prefix: string) => `assets:${prefix}`;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.MINIO_BUCKET ?? "iiiiibox-uploads";
  private readonly publicUrl = (
    process.env.MINIO_PUBLIC_URL ??
    `http://${process.env.MINIO_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}`
  ).replace(/\/$/, "");

  constructor(private readonly redis: RedisService) {
    this.client = new S3Client({
      endpoint: `http://${process.env.MINIO_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}`,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER ?? "minioadmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "minioadmin",
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        await this.client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: "*",
                  Action: ["s3:GetObject"],
                  Resource: [`arn:aws:s3:::${this.bucket}/*`],
                },
              ],
            }),
          }),
        );
        this.logger.log(`Created MinIO bucket "${this.bucket}" with public-read policy`);
      } catch (err) {
        this.logger.warn(
          `Could not reach MinIO to ensure bucket "${this.bucket}" exists — image uploads will fail until it's available: ${(err as Error).message}`,
        );
      }
    }
  }

  async upload(buffer: Buffer, contentType: string, prefix: string): Promise<string> {
    const key = `${prefix}/${randomUUID()}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    // Invalidate rather than wait out the TTL — a just-uploaded asset should
    // show up in the library immediately.
    await this.redis.del(assetsKey(prefix));
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  // Uploaded keys carry no original filename (see upload() above), so callers
  // only get a URL + timestamp to display, not a friendly name. Caps at 1000
  // keys (ListObjectsV2's own limit) — fine for a single-prefix asset gallery.
  // Display name comes from S3 user-metadata (`x-amz-meta-name`), not the key
  // itself — the key is what every already-placed component's `imageUrl`
  // points at, so renaming can never change it (see rename() below, which
  // updates metadata in place via CopyObjectCommand rather than moving the
  // object to a new key). Keys carry no name until explicitly set.
  async list(prefix: string) {
    const cached = await this.redis.get(assetsKey(prefix));
    if (cached !== null) return cached;

    const res = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: `${prefix}/` }),
    );
    const keys = (res.Contents ?? []).filter((o) => o.Key);
    const items = await Promise.all(
      keys.map(async (o) => {
        let name: string | null = null;
        try {
          const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: o.Key! }));
          name = head.Metadata?.name ?? null;
        } catch {
          // Metadata lookup failing shouldn't hide the asset — it just shows
          // up unnamed, same as anything uploaded before this feature existed.
        }
        return {
          key: o.Key!,
          url: `${this.publicUrl}/${this.bucket}/${o.Key}`,
          name,
          size: o.Size ?? 0,
          lastModified: o.LastModified?.toISOString() ?? null,
        };
      }),
    );
    items.sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));

    await this.redis.set(assetsKey(prefix), items, ASSETS_TTL_SECONDS);
    return items;
  }

  // Renames in place — copies the object onto its own key with new metadata
  // rather than moving it to a new key, so the URL (already embedded in any
  // page that placed this image) never changes.
  async rename(prefix: string, key: string, name: string) {
    if (!key.startsWith(`${prefix}/`)) throw new Error("Key does not belong to this prefix");
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: key,
        CopySource: `${this.bucket}/${key}`,
        Metadata: { name },
        MetadataDirective: "REPLACE",
      }),
    );
    await this.redis.del(assetsKey(prefix));
  }
}

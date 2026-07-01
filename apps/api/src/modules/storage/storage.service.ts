import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.MINIO_BUCKET ?? "iiiiibox-uploads";
  private readonly publicUrl = (
    process.env.MINIO_PUBLIC_URL ??
    `http://${process.env.MINIO_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}`
  ).replace(/\/$/, "");

  constructor() {
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
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.config.getOrThrow<string>('R2_PUBLIC_URL');

    // Cloudflare R2 expose une API compatible S3.
    // region: 'auto' est obligatoire pour R2 (pas de région AWS standard).
    // L'endpoint pointe vers le sous-domaine R2 propre au compte Cloudflare.
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(buffer: Buffer, folder: string, originalName: string, contentType?: string): Promise<{ key: string; url: string }> {
    const ext = originalName.split('.').pop();
    // UUID pour le nom de fichier : évite les collisions et les conflits
    // si deux artistes uploadent un fichier avec le même nom.
    const key = `${folder}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { key, url: `${this.publicUrl}/${key}` };
  }

  getPublicUrl(): string {
    return this.publicUrl;
  }

  async getSignedUrl(fileUrl: string, expiresIn = 60): Promise<string> {
    // L'URL stockée en base est l'URL publique complète ; on extrait la clé S3
    // en retirant le préfixe publicUrl avant de signer.
    const key = fileUrl.startsWith(this.publicUrl)
      ? fileUrl.slice(this.publicUrl.length + 1)
      : fileUrl;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
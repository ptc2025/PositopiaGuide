// Reference: javascript_object_storage integration
import { Storage } from "@google-cloud/storage";
import type { Response } from "express";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export class ObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectNotFoundError";
  }
}

// Configure storage client with Replit credentials
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectStorageService {
  private storage: Storage;
  private bucketId: string;
  private publicSearchPaths: string[];
  private privateDir: string;

  constructor() {
    this.storage = objectStorageClient;
    this.bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
    
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    this.publicSearchPaths = publicPaths.split(",").filter((p) => p.trim());
    this.privateDir = process.env.PRIVATE_OBJECT_DIR || "";
  }

  // Get upload URL for audio files
  async getAudioUploadURL(contentType: string = "audio/mpeg"): Promise<string> {
    const filename = `${this.privateDir}/audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    
    // Remove leading slash from filename if present
    const cleanFilename = filename.startsWith("/") ? filename.substring(1) : filename;
    
    // Use Replit's sidecar to sign the URL
    const signedUrl = await this.signObjectURL({
      bucketName: this.bucketId,
      objectName: cleanFilename,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });

    return signedUrl;
  }

  // Sign object URL using Replit's sidecar endpoint
  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to sign object URL, status: ${response.status}, error: ${errorText}`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }

  // Normalize object path for storage (relative to bucket root)
  normalizeObjectPath(uploadURL: string): string {
    const url = new URL(uploadURL);
    const pathParts = url.pathname.split("/").filter(p => p); // Remove empty parts
    const bucketIndex = pathParts.findIndex((p) => p === this.bucketId);
    if (bucketIndex === -1) {
      throw new Error("Invalid upload URL");
    }
    // Return path relative to bucket (without bucket ID)
    return "/" + pathParts.slice(bucketIndex + 1).join("/");
  }

  // Get file from object storage
  async getObjectFile(objectPath: string) {
    const cleanPath = objectPath.startsWith("/") ? objectPath.substring(1) : objectPath;
    const bucket = this.storage.bucket(this.bucketId);
    const file = bucket.file(cleanPath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError(`Object not found: ${objectPath}`);
    }

    return file;
  }

  // Download object to response
  async downloadObject(file: any, res: Response) {
    const [metadata] = await file.getMetadata();
    
    res.set({
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Content-Length": metadata.size,
      "Cache-Control": "public, max-age=31536000",
    });

    file.createReadStream().pipe(res);
  }

  // Search for public object
  async searchPublicObject(filePath: string) {
    for (const searchPath of this.publicSearchPaths) {
      try {
        const fullPath = `${searchPath}/${filePath}`.replace("//", "/");
        const file = await this.getObjectFile(fullPath);
        return file;
      } catch (error) {
        // Continue to next search path
      }
    }
    return null;
  }
}

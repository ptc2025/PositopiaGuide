// Reference: javascript_object_storage integration
import { Storage } from "@google-cloud/storage";
import type { Response } from "express";

export class ObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectNotFoundError";
  }
}

export class ObjectStorageService {
  private storage: Storage;
  private bucketId: string;
  private publicSearchPaths: string[];
  private privateDir: string;

  constructor() {
    this.storage = new Storage();
    this.bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
    
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    this.publicSearchPaths = publicPaths.split(",").filter((p) => p.trim());
    this.privateDir = process.env.PRIVATE_OBJECT_DIR || "";
  }

  // Get upload URL for audio files
  async getAudioUploadURL(contentType: string = "audio/mpeg"): Promise<string> {
    const bucket = this.storage.bucket(this.bucketId);
    const filename = `${this.privateDir}/audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return url;
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

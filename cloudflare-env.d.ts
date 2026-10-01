declare namespace Cloudflare {
  interface Env {
    KOBIS_API_KEY?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

"""
StorageService — uploads files to Cloudflare R2 (S3-compatible).
Handles video and thumbnail storage with public URL generation.
"""
import mimetypes
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class StorageService:
    """Wraps Cloudflare R2 (S3-compatible) for object storage."""

    def __init__(self) -> None:
        self._client_instance = None
        self.bucket = settings.R2_BUCKET_NAME
        self.is_local = not bool(settings.R2_ACCESS_KEY_ID)
        self.public_url = settings.R2_PUBLIC_URL.rstrip("/") if settings.R2_PUBLIC_URL else "http://localhost:8000/uploads"
        
        if self.is_local:
            Path("uploads").mkdir(exist_ok=True)

    @property
    def _client(self):
        if self.is_local:
            return None
        if self._client_instance is None:
            # If endpoint is invalid or empty, boto3 will raise ValueError.
            # Lazy initialization prevents the app from crashing on startup.
            endpoint_url = settings.R2_ENDPOINT_URL if settings.R2_ENDPOINT_URL and settings.R2_ENDPOINT_URL != "https://" else None
            self._client_instance = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name="auto",
            )
        return self._client_instance

    # ------------------------------------------------------------------
    # Upload helpers
    # ------------------------------------------------------------------

    def upload_video(self, file_bytes: bytes, original_filename: str, user_id: str) -> dict:
        """
        Upload a video file to R2 under users/{user_id}/videos/.
        Returns dict with object_key and public_url.
        """
        ext = Path(original_filename).suffix.lower()
        object_key = f"users/{user_id}/videos/{uuid.uuid4()}{ext}"
        content_type = mimetypes.guess_type(original_filename)[0] or "video/mp4"
        return self._upload(file_bytes, object_key, content_type)

    def upload_thumbnail(self, file_bytes: bytes, original_filename: str, user_id: str) -> dict:
        """
        Upload a thumbnail image to R2 under users/{user_id}/thumbnails/.
        Returns dict with object_key and public_url.
        """
        ext = Path(original_filename).suffix.lower()
        object_key = f"users/{user_id}/thumbnails/{uuid.uuid4()}{ext}"
        content_type = mimetypes.guess_type(original_filename)[0] or "image/jpeg"
        return self._upload(file_bytes, object_key, content_type)

    def _upload(self, file_bytes: bytes, object_key: str, content_type: str) -> dict:
        """Internal upload method. Returns object key and public URL."""
        if self.is_local:
            file_path = Path("uploads") / object_key
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(file_bytes)
        else:
            self._client.put_object(
                Bucket=self.bucket,
                Key=object_key,
                Body=file_bytes,
                ContentType=content_type,
            )
        public_url = f"{self.public_url}/{object_key}"
        return {"object_key": object_key, "public_url": public_url}

    # ------------------------------------------------------------------
    # Download / delete
    # ------------------------------------------------------------------

    def get_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a pre-signed download URL (for private buckets)."""
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": object_key},
            ExpiresIn=expires_in,
        )

    def download_to_bytes(self, object_key: str) -> bytes:
        """Download an object from R2 and return as bytes."""
        response = self._client.get_object(Bucket=self.bucket, Key=object_key)
        return response["Body"].read()

    def delete_object(self, object_key: str) -> None:
        """Delete an object from R2."""
        try:
            self._client.delete_object(Bucket=self.bucket, Key=object_key)
        except ClientError:
            pass  # Object may not exist


# Singleton
storage_service = StorageService()

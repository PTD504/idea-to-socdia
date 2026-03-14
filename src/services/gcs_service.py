"""
Google Cloud Storage service utilities.

Provides helpers to upload binary content and produce public asset URLs.
"""

import logging
from urllib.parse import urlparse

from google.cloud import storage

logger = logging.getLogger(__name__)


class GCSService:
    """Service wrapper around Google Cloud Storage operations."""

    def __init__(self) -> None:
        """Initialise a Google Cloud Storage client."""
        self.client = storage.Client()

    def upload_file_from_bytes(
        self,
        bucket_name: str,
        destination_blob_name: str,
        file_bytes: bytes,
        content_type: str,
    ) -> str:
        """Upload in-memory bytes to GCS and return a public URL.

        Args:
            bucket_name: Destination GCS bucket name.
            destination_blob_name: Full object path in the bucket.
            file_bytes: File content to upload.
            content_type: MIME type for the object.

        Returns:
            Public URL for the uploaded object.
        """
        if not bucket_name:
            raise ValueError("bucket_name cannot be empty.")
        if not destination_blob_name:
            raise ValueError("destination_blob_name cannot be empty.")
        if not file_bytes:
            raise ValueError("file_bytes cannot be empty.")
        if not content_type:
            raise ValueError("content_type cannot be empty.")

        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_string(file_bytes, content_type=content_type)

            # Ensure the object can be served directly from a stable public URL.
            blob.make_public()
            return blob.public_url
        except Exception as exc:
            logger.exception(
                "Failed to upload object to GCS. bucket=%s, blob=%s",
                bucket_name,
                destination_blob_name,
            )
            raise RuntimeError("GCS upload failed.") from exc

    def download_file_from_gcs_url(self, gcs_url: str, destination_file_path: str) -> None:
        """Download an object from a GCS URL to a local file path.

        Supports both `gs://bucket/path` and
        `https://storage.googleapis.com/bucket/path` URL styles.
        """
        bucket_name, blob_name = self._parse_gcs_url(gcs_url)
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            blob.download_to_filename(destination_file_path)
        except Exception as exc:
            logger.exception(
                "Failed to download GCS object. url=%s, target=%s",
                gcs_url,
                destination_file_path,
            )
            raise RuntimeError("GCS download failed.") from exc

    def _parse_gcs_url(self, gcs_url: str) -> tuple[str, str]:
        """Parse a GCS URL into bucket and blob names."""
        if gcs_url.startswith("gs://"):
            no_scheme = gcs_url[5:]
            if "/" not in no_scheme:
                raise ValueError(f"Invalid GCS URL: {gcs_url}")
            bucket_name, blob_name = no_scheme.split("/", 1)
            return bucket_name, blob_name

        parsed = urlparse(gcs_url)
        if parsed.scheme not in {"http", "https"}:
            raise ValueError(f"Unsupported URL scheme for GCS URL: {gcs_url}")

        if parsed.netloc == "storage.googleapis.com":
            path = parsed.path.lstrip("/")
            if "/" not in path:
                raise ValueError(f"Invalid storage.googleapis.com URL: {gcs_url}")
            bucket_name, blob_name = path.split("/", 1)
            return bucket_name, blob_name

        if parsed.netloc.endswith(".storage.googleapis.com"):
            bucket_name = parsed.netloc.replace(".storage.googleapis.com", "")
            blob_name = parsed.path.lstrip("/")
            if not blob_name:
                raise ValueError(f"Invalid bucket-hosted GCS URL: {gcs_url}")
            return bucket_name, blob_name

        raise ValueError(f"Unsupported GCS URL format: {gcs_url}")

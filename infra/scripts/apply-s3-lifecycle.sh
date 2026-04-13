#!/usr/bin/env bash
# Applies S3 lifecycle rules to the aiseo buckets.
#
# These buckets were provisioned outside the CDK stack (they're imported
# via s3.Bucket.fromBucketName) so we can't attach lifecycle configuration
# from CDK directly. Run this script once per environment with AWS
# credentials that can call s3api:PutBucketLifecycleConfiguration.
#
# Usage:
#   ./apply-s3-lifecycle.sh           # apply to all three buckets
#   AWS_PROFILE=aiseo-prod ./apply-s3-lifecycle.sh
#
# Rules:
#   upload bucket       → expire everything after 7 days (ZIPs are
#                         extracted into the sites bucket on deploy and
#                         never re-read, confirmed against
#                         backend/functions/deploy-site/handler.js)
#   sites buckets (dev+prod)
#                       → expire noncurrent versions after 30 days
#                         (keeps rollback window; prunes stale writes)
#
# Safe to run repeatedly — PutBucketLifecycleConfiguration is idempotent.

set -euo pipefail

UPLOAD_BUCKET="${UPLOAD_BUCKET:-aiseo-upload-bucket}"
SITES_BUCKET="${SITES_BUCKET:-aiseo-sites-bucket}"
SITES_BUCKET_DEV="${SITES_BUCKET_DEV:-aiseo-sites-dev-bucket}"

echo "Applying lifecycle to ${UPLOAD_BUCKET}..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "${UPLOAD_BUCKET}" \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "expire-uploaded-zips",
        "Status": "Enabled",
        "Filter": { "Prefix": "uploads/" },
        "Expiration": { "Days": 7 },
        "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
      }
    ]
  }'

for BUCKET in "${SITES_BUCKET}" "${SITES_BUCKET_DEV}"; do
  echo "Applying lifecycle to ${BUCKET}..."
  aws s3api put-bucket-lifecycle-configuration \
    --bucket "${BUCKET}" \
    --lifecycle-configuration '{
      "Rules": [
        {
          "ID": "expire-noncurrent-versions",
          "Status": "Enabled",
          "Filter": { "Prefix": "" },
          "NoncurrentVersionExpiration": { "NoncurrentDays": 30 },
          "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
        }
      ]
    }'
done

echo "Done. Verify with:"
echo "  aws s3api get-bucket-lifecycle-configuration --bucket ${UPLOAD_BUCKET}"

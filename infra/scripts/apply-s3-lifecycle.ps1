$env:AWS_PROFILE = "aiseo"

$UploadBucket   = "aiseo-upload-bucket"
$SitesBucket    = "aiseo-sites-bucket"
$SitesBucketDev = "aiseo-sites-dev-bucket"

# --- 1) Upload bucket: uploads/ 7일 만료 ---
$uploadRule = @'
{
  "Rules": [
    {
      "ID": "expire-uploaded-zips",
      "Status": "Enabled",
      "Filter": { "Prefix": "uploads/" },
      "Expiration": { "Days": 7 },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    }
  ]
}
'@
$uploadRule | Out-File -FilePath upload-lifecycle.json -Encoding ascii
aws s3api put-bucket-lifecycle-configuration `
  --bucket $UploadBucket `
  --lifecycle-configuration file://upload-lifecycle.json

# --- 2) Sites buckets (dev + prod): noncurrent version 30일 만료 ---
$sitesRule = @'
{
  "Rules": [
    {
      "ID": "expire-noncurrent-versions",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    }
  ]
}
'@
$sitesRule | Out-File -FilePath sites-lifecycle.json -Encoding ascii

foreach ($b in @($SitesBucket, $SitesBucketDev)) {
  Write-Host "Applying lifecycle to $b..."
  aws s3api put-bucket-lifecycle-configuration `
    --bucket $b `
    --lifecycle-configuration file://sites-lifecycle.json
}

# --- 검증 ---
aws s3api get-bucket-lifecycle-configuration --bucket $UploadBucket
aws s3api get-bucket-lifecycle-configuration --bucket $SitesBucketDev
aws s3api get-bucket-lifecycle-configuration --bucket $SitesBucket

# --- 임시파일 정리 ---
Remove-Item upload-lifecycle.json, sites-lifecycle.json

import AWS from "aws-sdk";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getFolderPath } from "./common";

// -------------------- ENV VALIDATION --------------------
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, BUCKET_NAME } =
  process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !BUCKET_NAME
) {
  throw new Error("Missing AWS configuration in environment variables");
}

// -------------------- CONFIG --------------------
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

// -------------------- INSTANCES --------------------
const s3 = new AWS.S3({
  signatureVersion: "v4",
});

// -------------------- TYPES --------------------
interface FileInput {
  fileName: string;
  fileType: string;
}

interface PresignedResponse {
  fileName: string;
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

// -------------------- DIRECT UPLOAD (OPTIONAL) --------------------
export const uploadToS3 = (
  params: AWS.S3.PutObjectRequest,
): Promise<AWS.S3.ManagedUpload.SendData> => {
  return s3.upload(params).promise();
};

// -------------------- SINGLE PRESIGNED URL --------------------
export const getPresignedUrl = async (
  fileName: string,
  fileType: string,
  type: string,
): Promise<string> => {
  const folderPath = getFolderPath(type);
  const fullPath = `${folderPath}/${fileName}`;

  // ❌ REMOVED UNUSED params (FIXED ESLINT ERROR)

  return s3.getSignedUrlPromise("putObject", {
    Bucket: BUCKET_NAME,
    Key: fullPath,
    ContentType: fileType,
    Expires: 600,
  });
};

// -------------------- MULTIPLE PRESIGNED URLS --------------------
export const getMultiplePresignedUrls = async (
  files: FileInput[],
  type: string,
): Promise<PresignedResponse[]> => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Files array is required");
  }

  const folderPath = getFolderPath(type);

  return Promise.all(
    files.map(async ({ fileName, fileType }) => {
      if (!fileName || !fileType) {
        throw new Error("fileName and fileType are required");
      }

      const extension = path.extname(fileName);
      const baseName = path.basename(fileName, extension);
      const uniqueFileName = `${baseName}-${uuidv4()}${extension}`;

      const fullPath = `${folderPath}/${uniqueFileName}`;

      const uploadUrl = await s3.getSignedUrlPromise("putObject", {
        Bucket: BUCKET_NAME,
        Key: fullPath,
        ContentType: fileType,
        Expires: 600,
      });

      return {
        fileName,
        uploadUrl,
        fileKey: fullPath,
        fileUrl: `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fullPath}`,
      };
    }),
  );
};

// -------------------- DELETE MULTIPLE --------------------
export const deleteMultipleFromS3 = async (
  files: string[],
): Promise<AWS.S3.DeleteObjectsOutput> => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Files array is required");
  }

  const objects = files.map((file) => {
    let key = file;

    if (file.startsWith("http")) {
      const url = new URL(file);
      key = decodeURIComponent(url.pathname.slice(1));
    }

    return { Key: key };
  });

  return s3
    .deleteObjects({
      Bucket: BUCKET_NAME,
      Delete: { Objects: objects, Quiet: false },
    })
    .promise();
};

// -------------------- CLEANUP SERVICE REPORT --------------------
interface ACPhotos {
  beforePhotos?: string[];
  afterPhotos?: string[];
}

export const cleanupServiceReportPhotos = async (
  acs: ACPhotos[] = [],
): Promise<void> => {
  if (!Array.isArray(acs) || acs.length === 0) return;

  const allPhotos: string[] = [];

  acs.forEach((ac) => {
    if (Array.isArray(ac.beforePhotos)) {
      allPhotos.push(...ac.beforePhotos);
    }

    if (Array.isArray(ac.afterPhotos)) {
      allPhotos.push(...ac.afterPhotos);
    }
  });

  if (allPhotos.length > 0) {
    await deleteMultipleFromS3(allPhotos);
  }
};

// -------------------- SAFE DELETE --------------------
export const safeDelete = async (files?: string | string[]): Promise<void> => {
  if (!files) return;

  try {
    const fileArray = Array.isArray(files) ? files : [files];
    await deleteMultipleFromS3(fileArray);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("S3 cleanup failed:", err.message);
    } else {
      console.error("S3 cleanup failed:", err);
    }
  }
};

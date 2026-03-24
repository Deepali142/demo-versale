import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

const allowedTypes = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel files
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx

  // Text files
  "text/plain",

  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Allowed file types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, WEBP",
      ),
    );
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

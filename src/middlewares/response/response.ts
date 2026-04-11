import { Response } from "express";

const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
  count?: number
) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    ...(data !== undefined && { data }),
    ...(count !== undefined && { count }),
  });
};

export const ok = (
  res: Response,
  message = "Success",
  data?: any,
  count?: number
) => sendResponse(res, 200, message, data, count);

export const badRequest = (res: Response, message: string) =>
  sendResponse(res, 400, message);

export const unauthorized = (res: Response, message = "Unauthorized") =>
  sendResponse(res, 401, message);

export const forbidden = (res: Response, message = "Forbidden") =>
  sendResponse(res, 403, message);

export const notFound = (res: Response, message = "Not Found") =>
  sendResponse(res, 404, message);

export const serverError = (
  res: Response,
  message = "Something went wrong"
) => sendResponse(res, 500, message);


export { sendResponse };
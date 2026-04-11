import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  createEnquiryService,
  getEnquiriesByUserService,
  getEnquiryByIdService,
} from "../../services/enquiry/enquiry.service";

import { STATUS, HTTP_CODE, MESSAGE } from "../../constants/responseConstants";
import { AuthPayload } from "../../middlewares/user/auth"; 

/**
 * CREATE ENQUIRY
 */
export const createEnquiryController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user as AuthPayload;

    if (!user?.id) {
      return res.status(HTTP_CODE.UNAUTHORIZED).json({
        status: STATUS.FAIL,
        message: "Unauthorized",
      });
    }

    const userContext = {
      _id: new Types.ObjectId(user.id),
    };

    const result = await createEnquiryService(req.body, userContext);

    return res.status(HTTP_CODE.SUCCESS).json({
      status: STATUS.SUCCESS,
      message: "Enquiry created successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Create Enquiry Error:", error);

    const errMsg =
      error instanceof Error ? error.message : MESSAGE.SERVER_ERROR;

    return res.status(HTTP_CODE.SERVER_ERROR).json({
      status: STATUS.FAIL,
      message: errMsg,
    });
  }
};

/**
 * GET ENQUIRIES BY USER
 */
export const getEnquiriesByUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user as AuthPayload;

    if (!user?.id) {
      return res.status(HTTP_CODE.UNAUTHORIZED).json({
        status: STATUS.FAIL,
        message: "Unauthorized",
      });
    }

    const {
      page = "1",
      limit = "10",
      search = "",
      sortField = "createdAt",
      sortOrder = "-1",
    } = req.query as Record<string, string>;

    const result = await getEnquiriesByUserService({
      userId: user.id,
      page: Number(page),
      limit: Number(limit),
      search,
      sortField,
      sortOrder: Number(sortOrder) as 1 | -1,
    });

    return res.status(HTTP_CODE.SUCCESS).json({
      status: STATUS.SUCCESS,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get Enquiries Error:", error);

    const errMsg =
      error instanceof Error ? error.message : MESSAGE.SERVER_ERROR;

    return res.status(HTTP_CODE.SERVER_ERROR).json({
      status: STATUS.FAIL,
      message: errMsg,
    });
  }
};

/**
 * GET ENQUIRY BY ID
 */
export const getEnquiryByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryId = req.params.id;

    if (!enquiryId) {
      return res.status(HTTP_CODE.BAD_REQUEST).json({
        status: STATUS.FAIL,
        message: "Enquiry ID is required",
      });
    }

    const enquiry = await getEnquiryByIdService(enquiryId);

    if (!enquiry) {
      return res.status(HTTP_CODE.NOT_FOUND).json({
        status: STATUS.FAIL,
        message: "Enquiry not found",
      });
    }

    return res.status(HTTP_CODE.SUCCESS).json({
      status: STATUS.SUCCESS,
      data: enquiry,
    });
  } catch (error: unknown) {
    console.error("Get Enquiry By ID Error:", error);

    const errMsg =
      error instanceof Error ? error.message : MESSAGE.SERVER_ERROR;

    return res.status(HTTP_CODE.SERVER_ERROR).json({
      status: STATUS.FAIL,
      message: errMsg,
    });
  }
};
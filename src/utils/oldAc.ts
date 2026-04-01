import { Types } from "mongoose";
import { OldAcEnquiryDetail } from "../models/enquiry/oldac.model";
import { deleteMultipleFromS3 } from "./s3.utils";

export interface IOldAcDetail {
  brand: string;
  tonnage: number;
  photos: string[];
}

interface IHandleOldAcEnquiryParams {
  enquiryId: Types.ObjectId;
  oldAcDetails: IOldAcDetail[];
}

// ✅ USED properly now
interface IOldAcResult {
  oldAcDoc: {
    toObject: () => Record<string, unknown>;
  };
  noOfAc: number;
}

export const handleOldAcEnquiry = async ({
  enquiryId,
  oldAcDetails,
}: IHandleOldAcEnquiryParams): Promise<IOldAcResult> => {
  if (!Array.isArray(oldAcDetails) || oldAcDetails.length === 0) {
    throw new Error("Old AC details are required for OLD_AC enquiry");
  }

  const oldAcDoc = await OldAcEnquiryDetail.create({
    enquiryId,
    oldAcDetails,
  });

  return {
    oldAcDoc,
    noOfAc: oldAcDetails.length,
  };
};

export const cleanupOldAcPhotos = async (
  oldAcDetails: IOldAcDetail[] = [],
): Promise<void> => {
  try {
    if (!Array.isArray(oldAcDetails) || oldAcDetails.length === 0) return;

    const allPhotos = oldAcDetails.flatMap((ac) =>
      Array.isArray(ac.photos) ? ac.photos : [],
    );

    if (allPhotos.length > 0) {
      await deleteMultipleFromS3(allPhotos);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Old AC photos cleanup failed:", error.message);
    } else {
      console.error("Old AC photos cleanup failed:", error);
    }
  }
};

export const cleanupCopperPipingImages = async (
  images: string[] = [],
): Promise<void> => {
  try {
    if (!Array.isArray(images) || images.length === 0) return;

    await deleteMultipleFromS3(images);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Copper piping images cleanup failed:", error.message);
    } else {
      console.error("Copper piping images cleanup failed:", error);
    }
  }
};

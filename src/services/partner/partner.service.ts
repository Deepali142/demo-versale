import mongoose, { Types } from "mongoose";
import Partner, { IPartner } from "../../models/partner/partner.model";

interface AddEditPartnerPayload {
  name: string;
  partnerId?: string;
  partnerLogo: string;
}
export interface PartnerListParams {
  limit: number;
  page: number;
  search: string;
  sortOrder: 1 | -1;
}

export interface PartnerListResponse {
  partners: IPartner[];
  total: number;
}

export const addEditPartnerService = async (
  payload: AddEditPartnerPayload,
): Promise<IPartner | null> => {
  const { name, partnerId, partnerLogo } = payload;

  // CREATE
  if (!partnerId) {
    const exists = await Partner.findOne({ name });
    if (exists) {
      throw new Error("Partner with this name already exists");
    }

    const newPartner = await Partner.create({
      name,
      logo: partnerLogo,
    });

    return newPartner;
  }

  // UPDATE
  const existingPartner = await Partner.findById(partnerId);

  if (!existingPartner) {
    throw new Error("Partner not found");
  }

  await Partner.updateOne(
    { _id: partnerId },
    {
      name,
      logo: partnerLogo || existingPartner.logo,
    },
  );

  return await Partner.findById(partnerId);
};

export const partnerListService = async ({
  limit,
  page,
  search,
  sortOrder,
}: PartnerListParams): Promise<PartnerListResponse> => {
  const offset = (page - 1) * limit;

  const partners = await Partner.find({
    name: { $regex: search, $options: "i" },
  })
    .skip(offset)
    .limit(limit)
    .sort({ name: sortOrder });

  const total = await Partner.countDocuments({
    name: { $regex: search, $options: "i" },
  });

  return { partners, total };
};

export const getPartnerByIdService = async (
  partnerId: string,
): Promise<IPartner | null> => {
  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(partnerId)) {
    return null;
  }

  return await Partner.findById(partnerId);
};

export const partnerActiveInactiveService = async (
  partnerId: string,
): Promise<{ message: string } | null> => {
  if (!mongoose.Types.ObjectId.isValid(partnerId)) {
    throw new Error("Invalid Partner ID");
  }

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return null;
  }

  const newStatus = partner.isActive ? false : true;

  await Partner.updateOne(
    { _id: new Types.ObjectId(partnerId) },
    { isActive: newStatus },
  );

  return {
    message: newStatus ? "Partner activated" : "Partner de-activated",
  };
};

export const mobilePartnerListService = async (): Promise<IPartner[]> => {
  return await Partner.find({ isActive: true });
};

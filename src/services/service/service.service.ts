import { Service, IService } from "../../models/service/service.model";
import { Types } from "mongoose";

interface IServiceListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortby?: string | undefined;
  orderby?: "asc" | "desc" | undefined;
}

interface IServiceWithImages {
  _id?: string;
  name?: string;
  icon?: string;
  isActive: boolean;
  orderBy: number;
  description: Record<string, unknown>[];
  terms: Record<string, unknown>[];
  key?: string;
  category?: string;
  images?: {
    icon: string;
    banner1: string;
    banner2: string;
  };
}

export const findServiceByNameAndCategory = async (
  name: string,
  category: string,
): Promise<IService | null> => {
  return Service.findOne({ name, category });
};

export const createService = async (
  serviceData: Partial<IService>,
): Promise<IService> => {
  const newService = new Service(serviceData);
  return newService.save();
};

export const findServiceById = async (
  serviceId: string,
): Promise<IService | null> => {
  if (!Types.ObjectId.isValid(serviceId)) return null;
  return Service.findById(serviceId);
};

export const findDuplicateService = async (
  serviceId: string,
  name: string,
  category: string,
): Promise<IService | null> => {
  return Service.findOne({
    _id: { $ne: serviceId },
    name,
    category,
  });
};

export const updateServiceById = async (
  serviceId: string,
  updateData: Partial<IService>,
): Promise<IService | null> => {
  return Service.findByIdAndUpdate(serviceId, updateData, { new: true });
};

// Toggle service active/inactive status

export const toggleServiceStatus = async (
  serviceId: string,
): Promise<IService | null> => {
  if (!Types.ObjectId.isValid(serviceId)) return null;

  const service = await Service.findById(serviceId);
  if (!service) return null;

  const newStatus = !service.isActive;

  return Service.findByIdAndUpdate(
    serviceId,
    { isActive: newStatus },
    { new: true },
  );
};

// Get paginated, searchable, sortable list of services.

export const getServiceList = async (query: IServiceListQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const search = query.search ?? "";
  const sortField = query.sortby ?? "createdAt";
  const sortOrder = query.orderby === "asc" ? 1 : -1;

  const offset = (page - 1) * limit;

  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }] }
    : {};

  const [services, total] = await Promise.all([
    Service.find(filter)
      .select("-terms -description")
      .sort({ [sortField]: sortOrder })
      .skip(offset)
      .limit(limit)
      .lean<IService[]>(),
    Service.countDocuments(filter),
  ]);

  return {
    services,
    total,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMobileServiceList = async (): Promise<IServiceWithImages[]> => {
  const BASE_URL = "http://137.59.53.70:8080/public";

  const services = await Service.find({ isActive: true })
    .sort({ orderBy: 1 })
    .lean<IServiceWithImages[]>();

  const imageMap: Record<string, string> = {
    STERILIZATION: "sterlization.png",
    REPAIR: "repair.png",
    INSTALLATION: "installation.png",
    COMPRESSOR: "compressor.png",
    GAS_CHARGING: "gasscharging.png",
    COPPER_PIPING: "Cpiping.png",
    AMC: "AMC.png",
  };

  const banner1 = `${BASE_URL}/banner1.png`;
  const banner2 = `${BASE_URL}/banner2.png`;

  // Attach appropriate images
  return services.map((service) => {
    const key = service.key || service.name?.toUpperCase() || "AMC";
    const fileName = imageMap[key] || "AMC.png";

    return {
      ...service,
      images: {
        icon: `${BASE_URL}/${fileName}`,
        banner1,
        banner2,
      },
    };
  });
};

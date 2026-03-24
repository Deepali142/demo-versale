import {
  ToolRequest,
  IToolRequest,
} from "../../models/toolsAndToolsBag/toolsRequest.model";

interface GetToolRequestListParams {
  page: number;
  limit: number;
  search: string;
  sortby: string;
}

export const createToolRequestService = async (payload: {
  technicianId: string;
  identifier: string;
  name: string;
  type: "TOOL" | "TOOL_BAG";
  quantity: number;
  comment: string;
  description: string;
  reason: "BROKEN" | "LOST" | "OTHER" | "NEW_ASSIGNMENT";
}): Promise<IToolRequest> => {
  const newRequest = new ToolRequest({
    technicianId: payload.technicianId,
    identifier: payload.identifier,
    name: payload.name,
    type: payload.type,
    quantity: payload.quantity,
    status: "REQUESTED",
    comment: payload.comment,
    description: payload.description,
    reason: payload.reason,
  });

  await newRequest.save();
  return newRequest;
};

export const getToolRequestListService = async ({
  page,
  limit,
  search,
  sortby,
}: GetToolRequestListParams) => {
  try {
    const query = search
      ? {
          $or: [
            { identifier: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await ToolRequest.countDocuments(query);
    const toolRequests = await ToolRequest.find(query)
      .sort({ [sortby]: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: toolRequests,
      total,
    };
  } catch {
    throw new Error("Failed to fetch tool request list");
  }
};

export const updateToolRequestStatusService = async (params: {
  requestId: string;
  status: string;
  comment?: string;
}) => {
  const { requestId, status, comment } = params;

  const validStatuses = ["REQUESTED", "APPROVED", "DENIED", "ASSIGNED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status provided");
  }

  const updatedRequest = await ToolRequest.findByIdAndUpdate(
    requestId,
    { status, comment },
    { new: true },
  );

  if (!updatedRequest) {
    return null;
  }

  return updatedRequest;
};

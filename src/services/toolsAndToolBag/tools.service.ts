import { FilterQuery } from "mongoose";
import { Tool, ITool } from "../../models/toolsAndToolsBag/tools.model";

interface AddToolPayload {
  name: string;
  description: string;
  image?: string;
}

export interface GetToolListParams {
  page: number;
  limit: number;
  search: string;
}

export const addToolService = async (payload: AddToolPayload) => {
  const { name, description, image } = payload;

  const existing = await Tool.findOne({ name });

  if (existing) {
    throw new Error("Tool with this name already exists");
  }

  const newTool = await Tool.create({
    name,
    description,
    image: image || "",
  });

  return newTool;
};

export const updateToolService = async (payload: {
  toolId: string;
  name?: string;
  description?: string;
  image?: string;
}) => {
  const { toolId, name, description, image } = payload;

  const updatedTool = await Tool.findByIdAndUpdate(
    toolId,
    {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
    },
    { new: true },
  );

  return updatedTool;
};

export const getToolListService = async ({
  page,
  limit,
  search,
}: GetToolListParams) => {
  const query: FilterQuery<ITool> = { active: true };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const total = await Tool.countDocuments(query);

  const tools = await Tool.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  return { tools, total };
};

export const removeToolService = async (toolId: string) => {
  const deletedTool = await Tool.findByIdAndUpdate(
    toolId,
    { active: false },
    { new: true },
  );

  return deletedTool; // returns null if not found
};

import mongoose from "mongoose";
import {
  ToolBag,
  IToolBag,
  IToolItem,
} from "../../models/toolsAndToolsBag/toolsBag.model";

export interface ToolBagPayload {
  name: string;
  description?: string;
  tools: {
    toolId: string;
    quantity: number;
    name: string;
    description?: string;
  }[];
}

export interface ModifyToolPayload {
  toolId: string;
  action: "add" | "remove";
  name?: string;
  quantity?: number;
  description?: string;
}

export const addToolBagService = async (
  payload: ToolBagPayload,
): Promise<IToolBag> => {
  const { name, description, tools } = payload;

  const newToolBag = new ToolBag({
    name,
    description: description || "",
    tools: tools || [],
  });

  await newToolBag.save();

  return newToolBag;
};

export const updateToolBagService = async (
  toolsBagId: string,
  updateData: Partial<ToolBagPayload>,
): Promise<IToolBag> => {
  if (!mongoose.Types.ObjectId.isValid(toolsBagId)) {
    throw { code: 400, message: "Invalid ToolBag ID format" };
  }

  const updatedToolBag = await ToolBag.findByIdAndUpdate(
    toolsBagId,
    updateData,
    {
      new: true,
    },
  );

  if (!updatedToolBag) {
    throw { code: 404, message: "ToolBag not found" };
  }

  return updatedToolBag;
};

export const getToolBagListService = async (
  page: number,
  limit: number,
  search: string,
) => {
  const query: Record<string, unknown> = { active: true };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const total = await ToolBag.countDocuments(query);

  const toolBags = await ToolBag.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  return { toolBags, total };
};

export const getToolBagByIdService = async (
  toolBagId: string,
): Promise<IToolBag> => {
  if (!mongoose.Types.ObjectId.isValid(toolBagId)) {
    throw { status: 400, message: "Invalid ToolBag ID format" };
  }

  const toolBag = await ToolBag.findById(toolBagId).populate("tools");

  if (!toolBag) {
    throw { status: 404, message: "ToolBag not found" };
  }

  return toolBag;
};

export const deleteToolBagService = async (toolBagId: string) => {
  if (!mongoose.Types.ObjectId.isValid(toolBagId)) {
    throw { status: 400, message: "Invalid ToolBag ID format" };
  }

  const deletedToolBag = await ToolBag.findByIdAndUpdate(
    toolBagId,
    { active: false },
    { new: true },
  );

  if (!deletedToolBag) {
    throw { status: 404, message: "ToolBag not found" };
  }

  return deletedToolBag;
};

export const modifyToolInToolsBagService = async (
  toolBagId: string,
  payload: ModifyToolPayload,
): Promise<IToolBag> => {
  const { toolId, name, quantity, description, action } = payload;

  if (!toolBagId) {
    throw new Error("ToolBag ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(toolBagId)) {
    throw new Error("Invalid ToolBag ID format");
  }

  if (!toolId || !["add", "remove"].includes(action)) {
    throw new Error("toolId and valid action ('add' or 'remove') are required");
  }

  if (action === "add" && (!name || !quantity)) {
    throw new Error("name and quantity are required when adding a tool");
  }

  const toolBag = await ToolBag.findById(toolBagId);
  if (!toolBag) {
    throw new Error("ToolBag not found");
  }

  if (action === "add") {
    const exists = toolBag.tools.some(
      (t: IToolItem) => t.toolId.toString() === toolId,
    );

    if (exists) {
      throw new Error("Tool already exists in ToolBag");
    }

    const newTool: IToolItem = {
      toolId: new mongoose.Types.ObjectId(toolId),
      name: name || "",
      quantity: quantity || 0,
      description: description || "",
    };

    toolBag.tools.push(newTool);
  }

  if (action === "remove") {
    const beforeCount = toolBag.tools.length;

    toolBag.tools = toolBag.tools.filter(
      (t: IToolItem) => t.toolId.toString() !== toolId,
    );

    if (beforeCount === toolBag.tools.length) {
      throw new Error("Tool not found in ToolBag");
    }
  }

  await toolBag.save();
  return toolBag;
};

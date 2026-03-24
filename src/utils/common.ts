import axios from "axios";

// -------------------- TYPES --------------------

interface Item {
  quantity: string;
  price: number | string;
}

// -------------------- TYPES --------------------
interface OTPResponse {
  type?: string;
  message?: string;
  request_id?: string;
}

// -------------------- RANDOM OTP --------------------

export const generateRandom4Digit = (): number => {
  return Math.floor(1000 + Math.random() * 9000);
};

// -------------------- FOLDER PATH --------------------

export const getFolderPath = (type: string | number): string => {
  const checkNumber = Number(type);

  let folder: string;

  switch (checkNumber) {
    case 1:
      folder = "service/banner";
      break;
    case 2:
      folder = "partner/image";
      break;
    case 3:
      folder = "user";
      break;
    case 4:
      folder = "technician/document";
      break;
    case 5:
      folder = "technician/profile";
      break;
    case 6:
      folder = "order/invoice";
      break;
    case 7:
      folder = "homebanners";
      break;
    case 8:
      folder = "service/icons";
      break;
    case 9:
      folder = "products";
      break;
    case 10:
      folder = "tools/image";
      break;
    default:
      throw new Error("Invalid type provided");
  }

  if (!process.env.BUCKET_FOLDER) {
    throw new Error("BUCKET_FOLDER is not defined in env");
  }

  return `${process.env.BUCKET_FOLDER}/${folder}`;
};

// -------------------- CALCULATE TOTAL --------------------

export const calculateTotal = (items: Item[]): number => {
  return items.reduce((total, item) => {
    const quantity = parseInt(item.quantity.replace("+", ""), 10);
    const price = Number(item.price);

    return total + quantity * price;
  }, 0);
};

// -------------------- SEND OTP SMS --------------------

export const sendOTPSMS = async (
  phone: string,
  OTP: number | string,
): Promise<OTPResponse> => {
  const { MSG91_TEMPLATE_ID, MSG91_URL, MSG91_AUTH_KEY } = process.env;

  if (!MSG91_TEMPLATE_ID || !MSG91_URL || !MSG91_AUTH_KEY) {
    throw new Error("MSG91 configuration missing in env");
  }

  const payload = {
    template_id: MSG91_TEMPLATE_ID,
    short_url: "0",
    realTimeResponse: "1",
    recipients: [
      {
        mobiles: `91${phone}`,
        var: String(OTP),
      },
    ],
  };

  try {
    const response = await axios.post<OTPResponse>(
      `${MSG91_URL}/api/v5/flow`,
      payload,
      {
        headers: {
          accept: "application/json",
          authkey: MSG91_AUTH_KEY,
          "content-type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("MSG91 Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to send OTP");
    }

    if (error instanceof Error) {
      console.error(error.message);
      throw error;
    }

    console.error("Unknown error", error);
    throw new Error("Unexpected error while sending OTP");
  }
};

import axios, { AxiosResponse } from "axios";

/**
 * Textlocal API response type
 */
interface ITextlocalMessage {
  id: string;
  recipient: string;
}

interface ITextlocalResponse {
  balance: number;
  batch_id: number;
  cost: number;
  num_messages: number;
  message: string;
  messages: ITextlocalMessage[];
  status: "success" | "failure";
  errors?: { code: number; message: string }[];
}

/**
 * Sends an OTP SMS via Textlocal API
 * @param toPhone - Recipient's phone number (with or without +91)
 * @param code - OTP code to send
 * @returns Textlocal API response
 */
export async function sendOtpSms(
  toPhone: string,
  code: string,
): Promise<ITextlocalResponse> {
  // Normalize phone number
  let formattedPhone = toPhone.trim();
  if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.slice(1);
  if (!formattedPhone.startsWith("91")) formattedPhone = "91" + formattedPhone;

  const messageTemplate = `Your OTP for login to AC Doctor App is ${code}. Thank you for using AC Doctor App. Terms and conditions apply.`;

  // Prepare form data properly using URLSearchParams
  const data = new URLSearchParams({
    apikey: process.env.SMS_KEY || "",
    numbers: formattedPhone,
    message: messageTemplate,
    sender: process.env.SMS_SENDER_HEADER || "",
  });

  console.log("Sending OTP to:", formattedPhone);

  try {
    const response: AxiosResponse = await axios.post(
      "https://api.textlocal.in/send/",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    console.log("OTP sent successfully:", response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error sending OTP:",
        error.response?.data || error.message,
      );
    } else {
      console.error("Unknown error:", error);
    }
    throw new Error("Failed to send OTP");
  }
}

// Alternative Twilio implementation (commented out)

// import twilio from "twilio";

// const accountSid = process.env.TWILIO_ACCOUNT_SID!;
// const authToken = process.env.TWILIO_AUTH_TOKEN!;
// const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

// const client = twilio(accountSid, authToken);

// export const sendOtpSms = async (toPhone: string, code: string) => {
//   try {
//     const msg = await client.messages.create({
//       body: `Your verification code is ${code}`,
//       from: fromPhone,
//       to: toPhone,
//     });
//     console.log("Sent OTP SMS:", msg.sid);
//   } catch (err) {
//     console.error("Error sending OTP SMS:", err);
//     throw new Error("Failed to send OTP");
//   }
// };

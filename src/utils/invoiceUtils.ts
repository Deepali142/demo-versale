import puppeteer from "puppeteer";
import moment from "moment";
import { Booking } from "../models/booking/booking.model";
import { calculateTotal } from "./calculateTotal";

export interface OrderItem {
  item: string;
  quantity: number | string;
  price: number;
}

export interface UserDetails {
  name: string;
  countryCode: string;
  phoneNumber: string;
}

export interface BookingData {
  bookingId: string;
  date: Date | string;
  addressDetails: string[];
}

/**
 * Generate invoice HTML template
 */
export function generateInvoice(
  orderItems: OrderItem[],
  invoiceNumber: string,
  bookingData: BookingData,
  userDetails: UserDetails,
): string {
  const subtotal = calculateTotal(orderItems);
  const formattedDate = moment(bookingData?.date).format("DD-MMM-YYYY");

  const s3_url = process.env.S3_BUCKET_URL || "";

  return `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice</title>
    <style>
      body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }
      .container { width: 80%; margin: 20px auto; background-color: #fff; padding: 20px; border: 1px solid #ccc; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
      .company-info { flex: 1; }
      .logo img { height: 100px; max-width: 200px; }
      .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ccc; padding: 12px; text-align: left; }
      th { background-color: #c0392b; color: #fff; }
      .total { text-align: center; margin-bottom: 20px; }
      .footer { text-align: center; font-size: 0.9em; color: #777; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="company-info">
          <h1>AC Doctor</h1>
          <p>
            Indore, Madhya Pradesh, 452001<br />
            Phone: +91-8959898989<br />
            Email: info@acdoctor.in
          </p>
        </div>
        <div class="logo">
          <img src="https://${s3_url}/logo/icon.png" alt="Company Logo" />
        </div>
      </div>

      <div class="details">
        <div>
          <h3>Bill To:</h3>
          <p>${userDetails?.name}<br/>Phone: ${userDetails?.countryCode}-${userDetails?.phoneNumber}</p>
        </div>
        <div>
          <h3>Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> #${bookingData?.bookingId}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems
            .map(
              (item) => `
            <tr>
              <td>${item.item}</td>
              <td>${item.quantity}</td>
              <td>₹${item.price.toFixed(2)}</td>
              <td>₹${(
                item.price *
                (typeof item.quantity === "string"
                  ? parseInt(item.quantity.replace("+", ""), 10)
                  : item.quantity)
              ).toFixed(2)}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>

      <div class="total">
        <h3>Total: ₹${subtotal.toFixed(2)}</h3>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>If you have any questions, contact Customer Care at info@acdoctor.in</p>
      </div>
    </div>
  </body>
  </html>`;
}

/**
 * Generate unique invoice ID
 */
export async function generateInvoiceId(): Promise<string> {
  const formattedDate = moment().format("DDMMYYYY");
  const count = await Booking.countDocuments();
  return `ACD_INV${formattedDate}${count + 1}`;
}

/**
 * Generate a PDF from HTML content
 */
export async function generatePdf(
  htmlContent: string,
  outputPath = "output.pdf",
): Promise<void> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.pdf({ path: outputPath, format: "A4" });
  await browser.close();
}

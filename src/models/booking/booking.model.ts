import { Schema, model, Types } from "mongoose";
import { IBooking } from "../../types/booking.types";

const bookingSchema = new Schema<IBooking>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    bookingId: {
      type: String,
      required: true,
      unique: true,
    },

    // SERVICES
    services: [
      {
        category: {
          type: String,
          enum: ["AC", "Boiler", "Heat Pump"],
          required: true,
        },

        items: [
          {
            serviceId: {
              type: Types.ObjectId,
                ref: "Service",

            },

            name: {
              type: String,
              required: true,
            },

            // Service Type (NEW)
            serviceType: {
              type: String,
              enum: ["Sterilization", "Repair", "Installation"],
              required: true,
            },

            quantity: {
              type: Number,
              required: true,
              default: 1,
              min: 1,
            },

            unitPrice: {
              type: Schema.Types.Decimal128,
              required: true,
              default: 0,
            },

            totalPrice: {
              type: Schema.Types.Decimal128,
              required: true,
              default: 0,
            },

            // Flexible attributes
            attributes: {
              type: {
                type: String, // AC / Boiler / Heat Pump
                required: true,
              },
              subType: {
                type: String, // Split / Window / Combi / Air Source
              },
              variant: {
                type: String, // Wall Mount / Floor Mount / Central
              },
            },
          },
        ],
      },
    ],

    // ADDRESS
    address: {
      type: Object,
      required: true,
    },

    // SLOT
    slot: {
      type: String,
      enum: ["FIRST_HALF", "SECOND_HALF", "FULL_DAY"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // PRICING
    itemTotal: {
      type: Schema.Types.Decimal128,
      default: 0,
    },

    discount: {
      type: Schema.Types.Decimal128,
      default: 0,
    },

    // 🇬🇧 VAT (UK TAX)
    tax: {
      vatRate: {
        type: Number,
        default: 20,
      },
      vatAmount: {
        type: Schema.Types.Decimal128,
        default: 0,
      },
    },

    grandTotal: {
      type: Schema.Types.Decimal128,
      default: 0,
    },

    currency: {
      type: String,
      default: "GBP",
    },

    // ORDER
    order_id: {
      type: String,
    },

    enquiryId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    //  STATUS
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },

    // TECHNICIAN
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // INVOICE
    invoiceUrl: String,
    invoiceId: String,
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  let itemTotal = 0;

  this.services.forEach((service: any) => {
    service.items.forEach((item: any) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);

      const total = qty * price;

      item.totalPrice = Types.Decimal128.fromString(total.toString());
      itemTotal += total;
    });
  });

  const discount = Number(this.discount || 0);
  const vatRate = Number(this.tax?.vatRate || 0);

  const taxable = itemTotal - discount;
  const vatAmount = (taxable * vatRate) / 100;

  this.itemTotal = Types.Decimal128.fromString(itemTotal.toString());
  this.tax.vatAmount = Types.Decimal128.fromString(vatAmount.toString());
  this.grandTotal = Types.Decimal128.fromString((taxable + vatAmount).toString());

  next();
});

export const Booking = model<IBooking>("Booking", bookingSchema);
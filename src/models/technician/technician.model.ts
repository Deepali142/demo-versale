import mongoose, { Document, Schema } from "mongoose";

export interface IKycDoc {
  type:
    | "PAN"
    | "AADHAR_FRONT"
    | "AADHAR_BACK"
    | "DRIVING_LICENSE"
    | "VOTER_ID"
    | "PASSPORT";
  url?: string;
  comment?: string;
}

interface ProfessionalSkill {
  acType: string;
  service: boolean;
  repair: boolean;
  install: boolean;
}

export interface ITechnician extends Document {
  name: string;
  joiningDate?: Date;
  type: "ACD" | "FC";
  position?:
    | "TBA"
    | "HELPER"
    | "TECHNICIAN"
    | "SENIOR TECHNICIAN"
    | "SUPERVISOR"
    | "MANAGER";
  kycStatus:
    | "TBU"
    | "PENDING"
    | "REVIEW_REQUESTED"
    | "IN_REVIEW"
    | "VERIFIED"
    | "REJECTED"
    | "REQUESTED";
  kycDocs?: IKycDoc[];
  professionalSkills?: ProfessionalSkill[];
  profilePhoto?: string;
  countryCode: string;
  phoneNumber: string;
  status:
    | "SIGNED_UP"
    | "PROFILE_CREATED"
    | "KYC_PENDING"
    | "ON_BOARDING"
    | "ON_JOB"
    | "AVAILABLE"
    | "ON_LEAVE"
    | "ON_BREAK"
    | "ON_TRAINING"
    | "DISABLED"
    | "TERMINATED"
    | "RESIGNED";
  email?: string | null;
  dob?: Date | null;
  secondaryContactNumber?: string;
  registered?: boolean;
  totalLeaves?: number;
  refreshToken?: string | undefined;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const technicianSchema = new Schema<ITechnician>(
  {
    name: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["ACD", "FC"],
      // required: true
    },
    position: {
      type: String,
      enum: [
        "TBA",
        "HELPER",
        "TECHNICIAN",
        "SENIOR TECHNICIAN",
        "SUPERVISOR",
        "MANAGER",
      ],
      default: "TBA",
    },
    kycStatus: {
      type: String,
      enum: [
        "TBU",
        "PENDING",
        "REVIEW_REQUESTED",
        "IN_REVIEW",
        "VERIFIED",
        "REJECTED",
        "REQUESTED",
      ],
      default: "PENDING",
      // required: true,
    },
    kycDocs: [
      {
        type: {
          type: String,
          enum: [
            "PAN",
            "AADHAR_FRONT",
            "AADHAR_BACK",
            "DRIVING_LICENSE",
            "VOTER_ID",
            "PASSPORT",
          ],
        },
        url: String,
        comment: String,
      },
    ],
    professionalSkills: [
      {
        acType: { type: String, required: true }, // e.g., "Window AC", "Split AC", etc.
        service: { type: Boolean, default: false },
        repair: { type: Boolean, default: false },
        install: { type: Boolean, default: false },
      },
    ],
    profilePhoto: { type: String, default: "" },
    countryCode: { type: String, default: "+91", required: true },
    phoneNumber: {
      type: String,
      unique: true,
      index: true,
      length: 10,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "SIGNED_UP",
        "PROFILE_CREATED",
        "KYC_PENDING",
        "ON_BOARDING",
        "ON_JOB",
        "AVAILABLE",
        "ON_LEAVE",
        "ON_BREAK",
        "ON_TRAINING",
        "DISABLED",
        "TERMINATED",
        "RESIGNED",
      ],
      default: "AVAILABLE",
      // required: true,
    },
    email: { type: String, default: null },
    dob: { type: Date, default: null },
    secondaryContactNumber: { type: String, default: "" },
    registered: { type: Boolean, default: false },
    totalLeaves: { type: Number, default: 0 },
    refreshToken: {
      type: String,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// (compound unique index to prevent duplicates per country)
technicianSchema.index({ countryCode: 1, phoneNumber: 1 }, { unique: true });
const Technician = mongoose.model<ITechnician>("Technician", technicianSchema);
export default Technician;

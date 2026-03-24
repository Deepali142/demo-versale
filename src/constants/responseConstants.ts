// Boolean enum for response status

export const STATUS = {
  SUCCESS: true,
  FAIL: false,
} as const;

// Numeric enum for HTTP response codes
export enum HTTP_CODE {
  SUCCESS = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// String enum for messages
export enum MESSAGE {
  // General messages
  SERVER_ERROR = "Something went wrong",
  INTERNAL_SERVER_ERROR = "Internal Server Error",
  NOT_FOUND = "No data found",

  // User messages
  INVALID_OTP = "Invalid otp",
  OTP_EXPIRED = "Otp expired. Please try again",

  // Token messages
  NO_TOKEN = "No token provided, access denied",
  INVALID_TOKEN = "Invalid or expired token",
  TOKEN_EXPIRED = "Refresh token expired",
  TOKEN_INVALID = "Invalid refresh token or user logged in on another device",

  // Service messages
  SERVICE_CREATED = "Service created successfully",
  SERVICE_UPDATE = "Service updated successfully",
  SERVICE_ACTIVATE = "Service activated",
  SERVICE_DEACTIVATE = "Service De-activated",

  // Authentication messages
  INVALID_CREDENTIALS = "Invalid email or password",
  USER_ID_REQUIRED = "Please provide user ID",
  LOGIN_SUCCESS = "Login successful",

  // User management messages
  USER_NOT_FOUND = "User not found",
  ACCOUNT_EXISTS = "Account already exists!",
  ACCOUNT_CREATED = "Account created successfully",
  PROFILE_UPDATED = "Profile updated successfully",
  USER_ACTIVATED = "User activated",
  USER_DEACTIVATED = "User deactivated",

  // Validation messages
  FIELDS_REQUIRED = "Country code and phone number are required.",
  REQUIRED_FIELDS = "Phone number, country code, and username are required",
  NAME_REQUIRED_FOR_BOOKING = "Name is required for booking",

  OTP_SENT = "OTP sent for verification",
  LOGIN_OTP_SENT = "OTP sent for login",

  // Booking management messages
  BOOKING_ID_REQUIRED = "Booking ID is required",
  BOOKING_NOT_FOUND = "Booking not found",
  ITEM_ADDED = "Order item added successfully",
  ITEM_UPDATED = "Order item updated successfully",
  MISSING_BOOKING_ID = "Missing booking ID",
  SERVICE_ID_REQUIRED = "Invalid or missing service ID",
  ADDRESS_ID_REQUIRED = "Address ID is required",
  VALID_ADDRESS_ID_REQUIRED = "Please provide valid address ID",
  SLOT_REQUIRED = "Slot is required",
  INVALID_DATE = "Invalid or missing date",
  BOOKING_AMOUNT = "Invalid or missing amount",
  BOOKING_CREATED = "Booking created successfully",
  BOOKING_UPDATED = "Booking updated successfully",

  ADMIN_ID_REQUIRED = "Admin ID is required",
  ADMIN_FETCHED = "Admin fetched successfully",
  ADMIN_DELETED = "Admin deleted successfully",

  // Technician management messages
  BOOKING_ID_AND_TECHNICIAN_ID_REQUIRED = "Booking Id and Technician Id are required",
  TECHNICIAN_NOT_AVAILABLE = "Technician is not available",
  TECHNICIAN_ASSIGNED_SUCCESS = "Technician assigned successfully",
  TECHNICIAN_NOT_FOUND = "Technician not found",
  TECHNICIAN_CREATED = "Technician added successfully",
  TECHNICIAN_UPDATED = "Technician updated successfully",
  TECHNICIAN_ID_REQUIRED = "Technician ID is required",
  TECHNICIAN_ACTIVATE = "Technician activated",
  TECHNICIAN_DEACTIVATE = "Technician deactivated",
  TECHNICIAN_PHONE_REQUIRED = "Phone number is required",

  // Lead messages
  QUANTITY_REQUIRED = "Quantity is required",
  PLACE_REQUIRED = "Place is required",
  LEAD_SAVED = "Lead saved successfully",

  // Notifications
  BOOKING_CREATE_NOTIFICATION = "Order booked",
  BOOKING_INVOICE_GENERATED = "Invoices generated",
  BOOKING_TECHNICIAN_ASSIGNED = "Hooray! Technician Assigned",
  BOOKING_COMPLETED = "Hooray! Booking Completed",
  FREE_CONSULTANCY = "Your request for free consultation is received, we will assign an executive for you shortly.",

  // Tools messages
  TOOL_CREATED = "Tool created successfully",
  TOOL_UPDATED = "Tool updated successfully",
  REQUIRED_FIELDS_MISSING_TOOLS = "Name, description, and image are required",
  TOOL_ID_REQUIRED = "Tool ID is required",
  TOOL_NOT_FOUND = "Tool not found",
  TOOL_REMOVED = "Tool removed successfully",

  // Promotion notification messages
  PROMO_REQUIRED_FIELDS = "Title and body are required",
  PROMO_SENT_SUCCESS = "Promotional notification sent successfully",
  FETCH_SUCCESS = "Promotional notifications fetched successfully",
  FETCH_FAILED = "Failed to fetch promotional notifications",
}

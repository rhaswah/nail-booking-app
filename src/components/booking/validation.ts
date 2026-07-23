/**
 * Client-side validation + input formatting for the booking details step.
 * Pure functions only — shared by the wizard (CTA enablement) and the
 * details step (inline field errors).
 */

export interface CustomerDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
}

export const emptyCustomerDraft: CustomerDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
};

export type CustomerField = "firstName" | "lastName" | "phone" | "email";
export type CustomerErrors = Partial<Record<CustomerField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomer(d: CustomerDraft): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!d.firstName.trim()) errors.firstName = "First name is required.";
  if (!d.lastName.trim()) errors.lastName = "Last name is required.";
  if (d.phone.replace(/\D/g, "").length !== 10) {
    errors.phone = "Enter a 10-digit phone number.";
  }
  if (!EMAIL_RE.test(d.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export function isCustomerValid(d: CustomerDraft): boolean {
  return Object.keys(validateCustomer(d)).length === 0;
}

/** Auto-format a US phone as the user types: "3105550148" → "(310) 555-0148". */
export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

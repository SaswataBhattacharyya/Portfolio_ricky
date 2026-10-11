/** Preserve the existing Django /api/submissions/ request contract without inventing customer data. */
export type InquiryForm = {
  name: string;
  email: string;
  phone: string;
  country: string;
  service: string;
  message: string;
  budget: string;
  currency: "USD" | "INR";
  duration: string;
  projectType: "" | "personal" | "company";
};

export const initialInquiry: InquiryForm = {
  name: "",
  email: "",
  phone: "",
  country: "",
  service: "",
  message: "",
  budget: "",
  currency: "USD",
  duration: "",
  projectType: "",
};

export function toSubmissionPayload(form: InquiryForm) {
  return {
    name: form.name,
    email: form.email,
    phone: form.phone,
    country: form.country,
    description: form.service ? `Service: ${form.service}\n\n${form.message}` : form.message,
    budget: form.budget,
    currency: form.currency,
    duration: form.duration,
    projectType: form.projectType,
    website: "",
  };
}

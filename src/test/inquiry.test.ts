import { describe, expect, it } from "vitest";
import { initialInquiry, toSubmissionPayload } from "@/lib/inquiry";

describe("redesigned homepage inquiry", () => {
  it("preserves the Django submissions schema with customer-provided values", () => {
    const payload = toSubmissionPayload({
      ...initialInquiry,
      name: "A customer",
      email: "customer@example.com",
      phone: "",
      country: "India",
      service: "Web Design & Development",
      message: "I'd like a new site.",
      budget: "45000",
      currency: "INR",
      duration: "1-month",
      projectType: "company",
    });
    expect(payload).toEqual({
      name: "A customer",
      email: "customer@example.com",
      phone: "",
      country: "India",
      description: "Service: Web Design & Development\n\nI'd like a new site.",
      budget: "45000",
      currency: "INR",
      duration: "1-month",
      projectType: "company",
      website: "",
    });
  });
  it("never silently manufactures a zero-dollar budget or fake location", () => {
    const payload = toSubmissionPayload(initialInquiry);
    expect(payload.budget).toBe("");
    expect(payload.country).toBe("");
    expect(payload.duration).toBe("");
  });
});

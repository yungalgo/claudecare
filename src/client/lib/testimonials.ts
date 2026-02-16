export interface Testimonial {
  quote: string;
  attribution: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "We caught a cognitive decline two weeks before the family noticed.",
    attribution: "Care Coordinator, Sunrise Senior Services",
  },
  {
    quote: "Our clients actually look forward to the calls. They ask when Sarah is calling next.",
    attribution: "Program Director, Golden Years Home Care",
  },
  {
    quote: "We went from checking in on 30 people a week to 200 — without adding staff.",
    attribution: "Operations Manager, CareFirst Network",
  },
  {
    quote: "The escalation alerts have prevented at least three ER visits this quarter alone.",
    attribution: "Clinical Lead, Harmony Elder Services",
  },
  {
    quote: "Set up monitoring for your entire roster in under 5 minutes. Upload a CSV and let AI handle the rest.",
    attribution: "Product Overview",
  },
  {
    quote: "It's like having a compassionate nurse who never forgets a detail and never burns out.",
    attribution: "Family Caregiver, Portland OR",
  },
  {
    quote: "The PHQ-2 scores flagged depression in a resident everyone thought was just quiet.",
    attribution: "Social Worker, Maple Ridge Assisted Living",
  },
  {
    quote: "My mother says it's the best part of her week. She doesn't even realize it's a check-up.",
    attribution: "Adult Daughter, Chicago IL",
  },
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

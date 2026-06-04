import type { MaintenancePriority, VendorType } from "@/utils/types";

export type MaintenanceRecommendationVendor = {
  name: string;
  type: VendorType;
};

export type MaintenanceRecommendation = {
  priority: MaintenancePriority;
  vendorType: VendorType;
  nextStep: string;
  ownerExplanation: string;
};

type VendorRule = {
  pattern: RegExp;
  vendorType: VendorType;
};

const VENDOR_RULES: VendorRule[] = [
  { pattern: /pool|spa|heater|water feature/, vendorType: "Pool" },
  { pattern: /irrigation|landscape|sprinkler|plant|tree|lawn|drip/, vendorType: "Landscape" },
  { pattern: /hvac|air|thermostat|temperature|ac|a\/c|cooling|heating/, vendorType: "HVAC" },
  { pattern: /clean|trash|linen|laundry|stain/, vendorType: "Cleaning" },
  { pattern: /plumb|leak|toilet|sink|shower|faucet|water/, vendorType: "Plumbing" },
  { pattern: /electric|breaker|outlet|light|lighting|power/, vendorType: "Electrical" }
];

function recommendVendorType(issueText: string): VendorType {
  return VENDOR_RULES.find((rule) => rule.pattern.test(issueText))?.vendorType ?? "Handyman";
}

function recommendPriority(issueText: string): MaintenancePriority {
  if (/active leak|flood|no air|no ac|no a\/c|electrical smell|sparking|security|forced entry|urgent/.test(issueText)) {
    return "Urgent";
  }

  if (/leak|not working|broken|damage|alarm|hvac|pool equipment/.test(issueText)) {
    return "High";
  }

  return "Medium";
}

export function suggestMaintenanceRecommendationFromIssue(
  title: string,
  description: string,
  vendors: MaintenanceRecommendationVendor[]
): MaintenanceRecommendation | null {
  const issueText = `${title} ${description}`.trim().toLowerCase();

  if (!issueText) return null;

  const vendorType = recommendVendorType(issueText);
  const priority = recommendPriority(issueText);
  const matchingVendor = vendors.find((vendor) => vendor.type === vendorType);
  const vendorLabel = matchingVendor ? matchingVendor.name : `${vendorType} vendor`;
  const nextStep =
    priority === "Urgent"
      ? `Contact ${vendorLabel} immediately and notify the homeowner with photo documentation.`
      : priority === "High"
        ? `Request availability from ${vendorLabel} and monitor until the repair is scheduled.`
        : `Add to the next service visit for ${vendorLabel} and continue monitoring.`;

  return {
    priority,
    vendorType,
    nextStep,
    ownerExplanation: `A ${vendorType.toLowerCase()} item was identified and is recommended for ${priority.toLowerCase()} follow-up. EstateIQ recommends documenting the condition, coordinating with ${vendorLabel}, and keeping the homeowner updated once timing is confirmed.`
  };
}

export function appendMaintenanceOwnerExplanation(description: string, ownerExplanation: string): string {
  const cleanDescription = description.trim();
  const cleanOwnerExplanation = ownerExplanation.trim();

  if (!cleanDescription) return cleanOwnerExplanation;

  return `${cleanDescription}\n\nOwner-facing note: ${cleanOwnerExplanation}`;
}

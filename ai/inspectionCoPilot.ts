import { visibleChecklistItems } from "@/utils/checklists";
import type {
  InspectionEvidenceReadiness,
  InspectionEvidenceReadinessInput,
  InspectionEvidenceTextInput,
  InspectionIssueSuggestion,
  OwnerUpdateDraft,
  VisitSummaryDraftInput,
  VisitSummaryEvidenceSignatureInput
} from "@/ai/types";
import type { Inspection, VendorType } from "@/utils/types";

export function draftWalkthroughCaptureNote(fileName: string): string {
  return `Walkthrough video captured for future AI-assisted review: ${fileName}. Use this recording to support the final notes, photo documentation, issue detection, and owner summary.`;
}

export function getInspectionEvidenceReadiness(
  input: InspectionEvidenceReadinessInput
): InspectionEvidenceReadiness {
  const hasNotes = Boolean(input.narration.trim() || input.notes.trim());
  const hasChecklist = input.checklistCount > 0;
  const hasPhotos = input.photoCount > 0;

  return {
    reviewReady: Boolean(hasNotes || hasChecklist || hasPhotos),
    issueReady: hasNotes,
    chips: [
      {
        readyLabel: "Notes captured",
        waitingLabel: "Notes needed",
        ready: hasNotes
      },
      {
        readyLabel: "Checklist started",
        waitingLabel: "Checklist needed",
        ready: hasChecklist
      },
      {
        readyLabel: "Photos added",
        waitingLabel: "Photos optional",
        ready: hasPhotos
      },
      {
        readyLabel: "Issue cue found",
        waitingLabel: "No issue cue",
        ready: hasNotes
      }
    ]
  };
}

export function buildInspectionEvidenceText({
  narration,
  notes,
  separator = " "
}: InspectionEvidenceTextInput): string {
  return [narration.trim(), notes.trim()].filter(Boolean).join(separator).trim();
}

export function buildVisitSummaryEvidenceSignature(input: VisitSummaryEvidenceSignatureInput): string {
  return [
    input.evidenceText.trim(),
    input.checklist.join("|"),
    input.photoCount,
    input.urgent,
    input.interiorTemperature,
    input.inspectionType
  ].join("::");
}

export function draftVisitSummary(input: VisitSummaryDraftInput) {
  const completionPhrase =
    input.completedCount === input.totalCount
      ? "All planned inspection items were completed"
      : `${input.completedCount} of ${input.totalCount} planned inspection items were completed`;
  const temperaturePhrase = input.interiorTemperature
    ? `Interior temperature was recorded at ${input.interiorTemperature} F`
    : "Interior temperature was not recorded";
  const photoPhrase = input.photoCount
    ? `${input.photoCount} supporting photo${input.photoCount === 1 ? " was" : "s were"} documented`
    : "No photos have been attached yet";
  const issuePhrase =
    input.urgent === "Yes"
      ? "Immediate homeowner attention is recommended based on the urgent issue flag"
      : "No urgent homeowner action is indicated from this inspection";
  const transcriptPhrase = input.narration.trim()
    ? `Walkthrough narration reviewed: ${input.narration.trim()}`
    : "";
  const notesPhrase = input.notes.trim()
    ? `Inspector notes: ${input.notes.trim()}`
    : "No additional issues were noted by the inspector";

  return [
    `${input.propertyName} received a ${input.inspectionType.toLowerCase()} by ${
      input.inspectorName || "the inspection team"
    }.`,
    `${completionPhrase}. ${temperaturePhrase}, and ${photoPhrase}.`,
    issuePhrase,
    transcriptPhrase,
    notesPhrase
  ]
    .filter(Boolean)
    .join(" ");
}

type ChecklistSuggestionRule = {
  pattern: RegExp;
  items: string[];
};

const CHECKLIST_SUGGESTION_RULES: ChecklistSuggestionRule[] = [
  {
    pattern: /perimeter|walked around|walk around|exterior|outside|yard|property grounds/,
    items: ["Walk perimeter of property", "Check driveway and entry appearance", "Inspect exterior condition"]
  },
  {
    pattern: /gate|fence|latch|access|entry|lock|door|window|secured|secure/,
    items: [
      "Check gates/fencing",
      "Inspect windows and doors",
      "Confirm entry access is working",
      "Secure doors and windows",
      "Confirm property is secured",
      "Confirm area is safe/secured"
    ]
  },
  {
    pattern: /forced entry|security|alarm|panel|break.?in|unlocked/,
    items: ["Look for signs of forced entry", "Inspect alarm panel status", "Confirm property is secured"]
  },
  {
    pattern: /thermostat|temperature|hvac|air|a\/c|ac|cooling|heating/,
    items: [
      "Check thermostat and HVAC operation",
      "Set thermostat to arrival temperature",
      "Check thermostat setting",
      "Check for HVAC concern"
    ]
  },
  {
    pattern: /leak|water|plumb|sink|shower|toilet|faucet|drip|disposal/,
    items: [
      "Run water at sinks/showers",
      "Flush toilets",
      "Check for plumbing leaks",
      "Run garbage disposal",
      "Check for active water leak"
    ]
  },
  {
    pattern: /ceiling|wall|water intrusion|mold|mildew|odor|odour/,
    items: ["Inspect ceilings/walls for water intrusion", "Look for mold/mildew odors"]
  },
  {
    pattern: /irrigation|sprinkler|landscape|plant|lawn|tree|flooding|dry spot/,
    items: ["Check irrigation leaks or flooding", "Verify landscape condition"]
  },
  {
    pattern: /pool|spa|water feature/,
    items: ["Inspect pool/spa area", "Inspect pool/spa presentation"]
  },
  {
    pattern: /light|lighting|outdoor lighting|interior lights|power|breaker|electrical/,
    items: [
      "Verify outdoor lighting functionality",
      "Turn on required interior lights",
      "Check electrical breakers if needed",
      "Check for electrical safety concern"
    ]
  },
  {
    pattern: /package|flyer|mail|delivery/,
    items: ["Check for package deliveries/flyers", "Remove flyers/packages from entry"]
  },
  {
    pattern: /fridge|refrigerator|freezer|appliance|kitchen/,
    items: ["Verify refrigerator/freezer operation", "Check kitchen and appliance condition", "Check for appliance concern"]
  },
  {
    pattern: /wifi|internet|router|network/,
    items: ["Check internet/WiFi system"]
  },
  {
    pattern: /smoke|carbon|co detector|detector/,
    items: ["Inspect smoke/CO detectors"]
  },
  {
    pattern: /pest|insect|bug|rodent/,
    items: ["Look for pest activity", "Check for insect activity"]
  },
  {
    pattern: /photo|picture|image|documented|documentation/,
    items: ["Photograph damage or maintenance concern", "Photograph any cleaning concerns", "Photograph any visible damage"]
  }
];

export function draftOwnerUpdateFromInspectionReport(inspection: Inspection, propertyName: string): OwnerUpdateDraft {
  const completedItems = visibleChecklistItems(inspection.checklist).length;
  const statusSummary =
    inspection.urgent === "Yes"
      ? "This report includes an urgent item that should be reviewed promptly by the homeowner or property manager."
      : completedItems === 0
        ? "The latest inspection report is ready for homeowner review."
        : "This inspection indicates the property is stable with no urgent homeowner action flagged at this time.";
  const summary = inspection.executiveSummary || statusSummary;

  return {
    category: "Inspection",
    status: "Draft",
    title: `${propertyName || "Property"} inspection report ready`,
    message: `${summary} The homeowner report is available for review and includes ${completedItems} completed checklist items and ${
      inspection.photos.length
    } photo${inspection.photos.length === 1 ? "" : "s"}.`
  };
}

export function suggestChecklistItemsFromInspectionEvidence(
  evidenceText: string,
  availableChecklistItems: string[]
): string[] {
  const issueText = evidenceText.trim().toLowerCase();

  if (!issueText) return [];

  const availableItems = new Set(availableChecklistItems);
  const suggestedItems = CHECKLIST_SUGGESTION_RULES.flatMap((rule) =>
    rule.pattern.test(issueText) ? rule.items.filter((item) => availableItems.has(item)) : []
  );

  return Array.from(new Set(suggestedItems));
}

type IssueSuggestionRule = {
  pattern: RegExp;
  draft: (issueText: string) => InspectionIssueSuggestion;
};

const ISSUE_SUGGESTION_RULES: IssueSuggestionRule[] = [
  {
    pattern: /security|gate|lock|door|window|access|alarm|forced entry/,
    draft: (issueText) => ({
      title: "Security or access concern",
      priority: /forced entry|unlocked|open door|alarm|security/.test(issueText) ? "Urgent" : "High",
      vendorType: "Handyman",
      description:
        "Security or access concern identified from inspection narration. Review doors, gates, locks, windows, panels, and any visible signs of concern.",
      nextStep: "Document with photos, verify the affected access point, and notify the homeowner with recommended next steps."
    })
  },
  {
    pattern: /leak|water|plumb|toilet|sink|shower|faucet|drip/,
    draft: (issueText) => ({
      title: "Water or plumbing concern",
      priority: /active leak|flood|standing water|water intrusion/.test(issueText) ? "Urgent" : "High",
      vendorType: "Plumbing",
      description:
        "Water or plumbing condition identified from inspection narration. Confirm the location, source, visible damage, and whether active water is present.",
      nextStep: "Capture photos, contact the plumbing vendor for availability, and update the homeowner once timing is confirmed."
    })
  },
  {
    pattern: /hvac|air|thermostat|temperature|ac|a\/c|cooling|heating/,
    draft: (issueText) => ({
      title: "HVAC performance concern",
      priority: /no air|no ac|no a\/c|not cooling|not heating/.test(issueText) ? "Urgent" : "High",
      vendorType: "HVAC",
      description:
        "HVAC performance concern identified from inspection narration. Confirm thermostat reading, airflow, abnormal noise, and interior temperature trend.",
      nextStep: "Request HVAC vendor review and keep the homeowner updated once service timing is confirmed."
    })
  },
  {
    pattern: /pool|spa|water feature|heater/,
    draft: (issueText) => ({
      title: "Pool or spa service item",
      priority: /equipment|heater|leak|pump|not working/.test(issueText) ? "High" : "Medium",
      vendorType: "Pool",
      description:
        "Pool or spa condition identified from inspection narration. Review water clarity, equipment status, visible leaks, and surrounding condition.",
      nextStep: "Request pool vendor review and continue monitoring until service is complete."
    })
  },
  {
    pattern: /irrigation|landscape|sprinkler|plant|tree|lawn|drip/,
    draft: (issueText) => ({
      title: "Landscape or irrigation issue",
      priority: /leak|flood|broken|dead|major/.test(issueText) ? "High" : "Medium",
      vendorType: "Landscape",
      description:
        "Landscape or irrigation condition identified from inspection narration. Review affected area, visible leaks, dry spots, plant stress, or water waste.",
      nextStep: "Coordinate with the landscape vendor and verify the condition at the next property visit."
    })
  }
];

const DEFAULT_ISSUE_SUGGESTION: InspectionIssueSuggestion = {
  title: "Inspection follow-up item",
  priority: "Medium",
  vendorType: "Handyman",
  description:
    "Follow-up item identified from inspection narration. Review the location, condition, photos, and recommended homeowner/vendor next step.",
  nextStep: "Document the item, assign the appropriate vendor if needed, and monitor until resolved."
};

export function suggestIssueFromInspectionEvidence(evidenceText: string): InspectionIssueSuggestion | null {
  const issueText = evidenceText.trim().toLowerCase();

  if (!issueText) return null;

  return ISSUE_SUGGESTION_RULES.find((rule) => rule.pattern.test(issueText))?.draft(issueText) ?? DEFAULT_ISSUE_SUGGESTION;
}

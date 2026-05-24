export const inspectionTypeMarkerPrefix = "__inspection_type__:";

export const inspectionTemplates = [
  {
    title: "Home Watch Inspection",
    description: "Routine exterior and interior property condition check.",
    sections: [
      {
        title: "Exterior Inspection",
        items: [
          "Walk perimeter of property",
          "Check gates/fencing",
          "Look for signs of forced entry",
          "Inspect windows and doors",
          "Inspect roofline visually from ground",
          "Check irrigation leaks or flooding",
          "Verify landscape condition",
          "Check for package deliveries/flyers",
          "Inspect pool/spa area",
          "Verify outdoor lighting functionality",
          "Look for pest activity"
        ]
      },
      {
        title: "Interior Inspection",
        items: [
          "Check thermostat and HVAC operation",
          "Run water at sinks/showers",
          "Flush toilets",
          "Check for plumbing leaks",
          "Inspect ceilings/walls for water intrusion",
          "Verify refrigerator/freezer operation",
          "Check electrical breakers if needed",
          "Inspect smoke/CO detectors",
          "Look for mold/mildew odors",
          "Check internet/WiFi system",
          "Inspect alarm panel status",
          "Open/close blinds occasionally",
          "Run garbage disposal",
          "Check for insect activity"
        ]
      }
    ]
  },
  {
    title: "Pre-Guest Arrival Inspection",
    description: "Final readiness check before homeowners or guests arrive.",
    sections: [
      {
        title: "Arrival Readiness",
        items: [
          "Confirm entry access is working",
          "Verify home is clean and staged",
          "Set thermostat to arrival temperature",
          "Turn on required interior lights",
          "Check internet/WiFi system",
          "Verify TVs/remotes are present",
          "Confirm linens and towels are ready",
          "Check welcome items or owner instructions"
        ]
      },
      {
        title: "Exterior Readiness",
        items: [
          "Check driveway and entry appearance",
          "Remove flyers/packages from entry",
          "Verify outdoor seating is arranged",
          "Inspect pool/spa presentation",
          "Verify landscape condition",
          "Check outdoor lighting functionality"
        ]
      }
    ]
  },
  {
    title: "Post-Checkout Inspection",
    description: "Departure check after guests or renters leave.",
    sections: [
      {
        title: "Interior Departure Review",
        items: [
          "Check for personal items left behind",
          "Inspect furniture and decor condition",
          "Check kitchen and appliance condition",
          "Run garbage disposal",
          "Check bathrooms for issues",
          "Inspect linens/towels for damage",
          "Check thermostat setting",
          "Secure doors and windows"
        ]
      },
      {
        title: "Exterior Departure Review",
        items: [
          "Inspect patio furniture condition",
          "Check BBQ/outdoor kitchen condition",
          "Inspect pool/spa area",
          "Check garage and trash area",
          "Look for damage or unusual wear",
          "Confirm property is secured"
        ]
      }
    ]
  },
  {
    title: "Cleaner Completion Report",
    description: "Verify cleaning team completion and property presentation.",
    sections: [
      {
        title: "Cleaning Verification",
        items: [
          "Verify floors are clean",
          "Verify kitchen is cleaned",
          "Verify bathrooms are cleaned",
          "Check beds and linens",
          "Check towels and supplies",
          "Verify trash has been removed",
          "Inspect dusting and surfaces",
          "Confirm laundry area is clear"
        ]
      },
      {
        title: "Presentation Check",
        items: [
          "Verify blinds/window coverings are set",
          "Check lights and fans are set",
          "Confirm exterior areas are tidy",
          "Photograph any cleaning concerns",
          "Confirm home is locked and secured"
        ]
      }
    ]
  },
  {
    title: "Damage / Maintenance Report",
    description: "Document damage, maintenance needs, and urgent repairs.",
    sections: [
      {
        title: "Issue Documentation",
        items: [
          "Identify location of issue",
          "Photograph damage or maintenance concern",
          "Describe severity of issue",
          "Check for active water leak",
          "Check for electrical safety concern",
          "Check for HVAC concern",
          "Check for appliance concern",
          "Note vendor access needs"
        ]
      },
      {
        title: "Follow-Up Status",
        items: [
          "Determine if issue is urgent",
          "Notify homeowner if needed",
          "Recommend vendor follow-up",
          "Confirm area is safe/secured",
          "Add notes for next inspection"
        ]
      }
    ]
  },
  {
    title: "Vehicle / Golf Cart Check",
    description: "Condition and readiness check for vehicles or golf carts.",
    sections: [
      {
        title: "Vehicle / Cart Condition",
        items: [
          "Inspect exterior condition",
          "Check tires visually",
          "Check battery/charger connection",
          "Check fuel or charge level if visible",
          "Verify keys are present",
          "Check for warning lights if operated",
          "Look for leaks underneath",
          "Photograph any visible damage"
        ]
      },
      {
        title: "Storage / Security",
        items: [
          "Confirm vehicle/cart is parked correctly",
          "Confirm garage or storage area is secured",
          "Check registration/permit visibility if needed",
          "Note maintenance needs",
          "Confirm charging area is safe"
        ]
      }
    ]
  }
] as const;

export type InspectionType = (typeof inspectionTemplates)[number]["title"];

export const defaultInspectionType: InspectionType = "Home Watch Inspection";

export function getInspectionTemplate(type: string) {
  return inspectionTemplates.find((template) => template.title === type) ?? inspectionTemplates[0];
}

export function getInspectionType(checklist: string[]) {
  const marker = checklist.find((item) => item.startsWith(inspectionTypeMarkerPrefix));
  const type = marker?.slice(inspectionTypeMarkerPrefix.length);
  return getInspectionTemplate(type || defaultInspectionType).title;
}

export function withInspectionType(checklist: string[], type: string) {
  return [
    `${inspectionTypeMarkerPrefix}${getInspectionTemplate(type).title}`,
    ...checklist.filter((item) => !item.startsWith(inspectionTypeMarkerPrefix))
  ];
}

export function visibleChecklistItems(checklist: string[]) {
  return checklist.filter((item) => !item.startsWith(inspectionTypeMarkerPrefix));
}

export function groupChecklistItems(selectedItems: string[], type = getInspectionType(selectedItems)) {
  const visibleItems = visibleChecklistItems(selectedItems);
  const sections = getInspectionTemplate(type).sections;
  const knownItems = new Set<string>(sections.flatMap((section) => [...section.items]));
  const groupedSections = sections.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => visibleItems.includes(item))
  }));
  const additionalItems = visibleItems.filter((item) => !knownItems.has(item));

  return additionalItems.length
    ? [...groupedSections, { title: "Additional Checks", items: additionalItems }]
    : groupedSections;
}

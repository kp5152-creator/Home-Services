export const checklistSections = [
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
] as const;

export function groupChecklistItems(selectedItems: string[]) {
  const knownItems = new Set<string>(checklistSections.flatMap((section) => [...section.items]));
  const groupedSections = checklistSections.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => selectedItems.includes(item))
  }));
  const additionalItems = selectedItems.filter((item) => !knownItems.has(item));

  return additionalItems.length
    ? [...groupedSections, { title: "Additional Checks", items: additionalItems }]
    : groupedSections;
}

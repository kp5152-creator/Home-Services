import { withInspectionType } from "@/utils/checklists";
import type { Database } from "@/utils/types";

const propertyId = "demo-property-estate";
const inspectionId = "demo-inspection-home-watch";

export const demoDatabase: Database = {
  properties: [
    {
      id: propertyId,
      status: "Active",
      name: "Cielo Vista Estate",
      owner: "Sample Homeowner",
      address: "74200 Desert Crest Drive, La Quinta CA 92253",
      phone: "(760) 555-0198",
      email: "sample.owner@example.com",
      accessNotes:
        "Demo access only. Standard access notes are available for the inspection team. No real client access codes or security details are stored in this sample."
    }
  ],
  inspections: [
    {
      id: inspectionId,
      propertyId,
      timestamp: "2026-05-25T17:30:00.000Z",
      inspectorName: "Avery Stone",
      interiorTemperature: "74",
      checklist: withInspectionType(
        [
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
          "Look for pest activity",
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
        ],
        "Home Watch Inspection"
      ),
      executiveSummary:
        "Cielo Vista Estate was inspected and remains in stable, guest-ready condition. Exterior access points were secure, interior systems were operating normally, and the property showed no signs of intrusion or water intrusion. Pool, landscape, and interior presentation were documented with sample photos for this demo report.",
      notes:
        "Demo inspection completed for customer presentation. Minor landscape monitoring item noted near the south planter; no urgent homeowner action required.",
      urgent: "No",
      photos: [
        {
          id: "demo-photo-entry",
          name: "Modern estate exterior.jpg",
          url: "/demo-exterior.jpg",
          mimeType: "image/jpeg",
          size: 258000
        },
        {
          id: "demo-photo-pool",
          name: "Pool and spa presentation.jpg",
          url: "/demo-pool.jpg",
          mimeType: "image/jpeg",
          size: 266000
        },
        {
          id: "demo-photo-interior",
          name: "Interior systems check.jpg",
          url: "/demo-interior.jpg",
          mimeType: "image/jpeg",
          size: 246000
        }
      ]
    }
  ],
  maintenanceIssues: [
    {
      id: "demo-maintenance-irrigation",
      propertyId,
      createdAt: "2026-05-25T18:05:00.000Z",
      title: "South planter irrigation monitoring",
      description:
        "Slight moisture observed near the south planter line. No active flooding. Recommend landscape vendor review during the next scheduled service.",
      priority: "Medium",
      status: "Scheduled",
      vendor: "Desert Bloom Landscape",
      nextStep: "Landscape vendor scheduled to inspect drip line and report findings.",
      photos: [
        {
          id: "demo-maintenance-photo",
          name: "Landscape monitoring area.jpg",
          url: "/demo-exterior.jpg",
          mimeType: "image/jpeg",
          size: 258000
        }
      ]
    }
  ],
  vendors: [
    {
      id: "demo-vendor-landscape",
      propertyId,
      createdAt: "2026-05-20T16:00:00.000Z",
      name: "Desert Bloom Landscape",
      type: "Landscape",
      contactName: "Marisol Vega",
      phone: "(760) 555-0144",
      email: "landscape@example.com",
      notes: "Preferred demo vendor for landscape and irrigation service."
    },
    {
      id: "demo-vendor-pool",
      propertyId,
      createdAt: "2026-05-20T16:05:00.000Z",
      name: "Aqua Reserve Pool Care",
      type: "Pool",
      contactName: "Elliot Park",
      phone: "(760) 555-0181",
      email: "pool@example.com",
      notes: "Weekly pool and spa service."
    }
  ],
  scheduleTasks: [
    {
      id: "demo-schedule-home-watch",
      propertyId,
      createdAt: "2026-05-25T18:15:00.000Z",
      scheduledFor: "2026-05-29T16:00:00.000Z",
      type: "Home Watch",
      title: "Weekly estate inspection",
      status: "Scheduled",
      assignedTo: "Avery Stone",
      notes: "Complete full interior/exterior home watch workflow and prepare homeowner packet."
    },
    {
      id: "demo-schedule-vendor",
      propertyId,
      createdAt: "2026-05-25T18:20:00.000Z",
      scheduledFor: "2026-05-27T17:30:00.000Z",
      type: "Vendor",
      title: "Landscape vendor irrigation review",
      status: "Scheduled",
      assignedTo: "Desert Bloom Landscape",
      notes: "Inspect south planter drip line and confirm no leak."
    }
  ],
  ownerUpdates: [
    {
      id: "demo-owner-update-shared",
      propertyId,
      createdAt: "2026-05-25T18:30:00.000Z",
      category: "Inspection",
      title: "Weekly inspection completed",
      message:
        "Your EstateIQ inspection is complete. The property remains secure and stable, with systems operating normally. A minor irrigation item is scheduled for vendor review and will continue to be monitored.",
      status: "Shared"
    }
  ]
};

export function isDemoInspectionId(id: string) {
  return demoDatabase.inspections.some((inspection) => inspection.id === id);
}

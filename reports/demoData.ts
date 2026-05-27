import { withInspectionType } from "@/utils/checklists";
import type { Database } from "@/utils/types";

const propertyId = "demo-property-estate";
const villaPropertyId = "demo-property-villa";
const ridgePropertyId = "demo-property-ridge";
const casitaPropertyId = "demo-property-casita";
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
    },
    {
      id: villaPropertyId,
      status: "Active",
      name: "Mirage Palms Villa",
      owner: "Sample Villa Owner",
      address: "78110 Palms Ridge Lane, Indian Wells CA 92210",
      phone: "(760) 555-0126",
      email: "villa.owner@example.com",
      accessNotes:
        "Demo access only. Inspector should verify exterior gates, courtyard lighting, pool equipment, and package area."
    },
    {
      id: ridgePropertyId,
      status: "Active",
      name: "Desert Ridge Retreat",
      owner: "Sample Retreat Owner",
      address: "53340 Canyon Vista Road, Palm Desert CA 92260",
      phone: "(760) 555-0173",
      email: "retreat.owner@example.com",
      accessNotes:
        "Demo access only. Focus on hillside drainage, garage entry, HVAC operation, and rear patio condition."
    },
    {
      id: casitaPropertyId,
      status: "Active",
      name: "Sagebrush Casita",
      owner: "Sample Casita Owner",
      address: "45815 Sagebrush Court, Rancho Mirage CA 92270",
      phone: "(760) 555-0162",
      email: "casita.owner@example.com",
      accessNotes:
        "Demo access only. Check guest-ready presentation, thermostat, plumbing fixtures, and private courtyard."
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
    },
    {
      id: "demo-vendor-villa-cleaning",
      propertyId: villaPropertyId,
      createdAt: "2026-05-21T15:00:00.000Z",
      name: "Palm Housekeeping Co.",
      type: "Cleaning",
      contactName: "Nina Sol",
      phone: "(760) 555-0138",
      email: "cleaning@example.com",
      notes: "Demo turnover and arrival-prep vendor."
    },
    {
      id: "demo-vendor-ridge-hvac",
      propertyId: ridgePropertyId,
      createdAt: "2026-05-21T15:20:00.000Z",
      name: "Summit Climate Service",
      type: "HVAC",
      contactName: "Grant Cole",
      phone: "(760) 555-0159",
      email: "hvac@example.com",
      notes: "Demo HVAC service contact for seasonal checks."
    },
    {
      id: "demo-vendor-casita-handyman",
      propertyId: casitaPropertyId,
      createdAt: "2026-05-21T15:40:00.000Z",
      name: "Valley Estate Repairs",
      type: "Handyman",
      contactName: "Lena Hart",
      phone: "(760) 555-0117",
      email: "repairs@example.com",
      notes: "Demo general repair and guest-readiness support."
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
    },
    {
      id: "demo-schedule-villa-arrival",
      propertyId: villaPropertyId,
      createdAt: "2026-05-25T19:00:00.000Z",
      scheduledFor: "2026-05-30T18:00:00.000Z",
      type: "Pre-Guest Arrival",
      title: "Guest arrival readiness",
      status: "Scheduled",
      assignedTo: "Avery Stone",
      notes: "Confirm cleaning completion, pool presentation, thermostat, and entry lighting."
    },
    {
      id: "demo-schedule-ridge-home-watch",
      propertyId: ridgePropertyId,
      createdAt: "2026-05-25T19:15:00.000Z",
      scheduledFor: "2026-06-01T16:30:00.000Z",
      type: "Home Watch",
      title: "Ridge property check",
      status: "Scheduled",
      assignedTo: "Avery Stone",
      notes: "Focus on hillside drainage, HVAC, and rear patio after wind conditions."
    },
    {
      id: "demo-schedule-casita-cleaner",
      propertyId: casitaPropertyId,
      createdAt: "2026-05-25T19:30:00.000Z",
      scheduledFor: "2026-05-28T20:00:00.000Z",
      type: "Cleaner",
      title: "Casita turnover confirmation",
      status: "Scheduled",
      assignedTo: "Palm Housekeeping Co.",
      notes: "Verify linens, kitchen reset, courtyard sweep, and guest-ready details."
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

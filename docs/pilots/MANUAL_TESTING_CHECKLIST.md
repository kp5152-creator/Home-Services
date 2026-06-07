# EstateIQ Manual Testing Checklist

Use this checklist before a customer demo, pilot meeting, or production deploy.

## 1. App Launch

- Open the app homepage.
- Confirm EstateIQ logo appears.
- Confirm the login/onboarding screen loads without an application error.
- Confirm Admin, Inspector, and Homeowner role options are visible.
- Confirm Customer Demo Mode options are visible.

## 2. Demo Mode

Test each demo role:

- Click Demo Admin.
- Confirm Demo Mode Active banner appears.
- Confirm Cielo Vista Estate loads.
- Click Exit Demo.
- Click Demo Inspector.
- Confirm inspection workflow opens.
- Click Exit Demo.
- Click Demo Homeowner.
- Confirm owner portal opens.
- Confirm no real client data appears in demo mode.

## 3. Property Onboarding

- Start with no selected property or use Add Homeowner Profile.
- Try saving an empty property form and confirm required fields stop the save.
- Save a valid property with name, homeowner, street address, city, and state.
- Confirm the form closes after save.
- Confirm the property appears in the property list.

## 4. Mobile Inspection Workflow

Use a narrow/mobile browser size or phone:

- Open Inspector flow.
- Confirm progress tiles are visible.
- Select an inspection type.
- Add inspector name.
- Add interior temperature.
- Use Select all for exterior checklist.
- Use Select all for interior checklist.
- Add at least one photo.
- Draft suggested summary.
- Use summary as executive summary.
- Confirm Generate Report is disabled until essentials are complete.
- Generate report.
- Confirm the report appears in history.

## 5. Maintenance Issues

- Create a maintenance issue with title and description.
- Add at least one photo.
- Assign or enter vendor information if available.
- Save issue.
- Confirm thumbnail/photo preview appears.
- Change status to Resolved.
- Confirm dashboard urgent/open counts update.

## 6. Vendors and Schedule

- Add a vendor contact.
- Confirm vendor appears under property contacts.
- Create a scheduled task.
- Confirm schedule item appears.
- Confirm status can be updated.

## 7. Owner Portal

- Open Homeowner role or Owner Portal view.
- Confirm homeowner sees property condition, reports, and shared updates.
- Confirm internal-only controls are not shown in homeowner role.

## 8. Reports and PDF

- Open demo report: /reports/demo-inspection-home-watch.
- Confirm report page loads.
- Click Download PDF File.
- Confirm PDF opens.
- Confirm PDF is branded and 3 pages.
- Confirm photos are visible.
- Confirm no real access/security details are visible.

## 9. PWA / Refresh Safety

- Refresh the app.
- Confirm no client-side application error appears.
- Confirm demo buttons still work after refresh.
- Confirm the app does not show stale content after a rebuild/deploy.
- Confirm app/report loading states use branded EstateIQ screens, not blank pages.
- Open a bad URL and confirm the branded EstateIQ not-found page appears.
- If a route fails, confirm the recovery screen includes Try Again and Health actions.

## 10. Security and Privacy Spot Check

- Confirm demo data uses sample homeowner/contact information.
- Confirm no gate codes, alarm codes, or lockbox codes appear in demo reports.
- Confirm real local test data is not accidentally shown during customer demos.
- Confirm data/db.json is reviewed before committing.

## Pass Criteria

For a pilot demo, all of these should pass:

- Demo Admin, Inspector, and Homeowner work.
- Inspection can be completed on mobile.
- PDF export works.
- No app errors after refresh.
- Loading, recovery, and not-found states feel branded and calm.
- No real client data appears in demo mode.

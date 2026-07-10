import { PageTemplate, DESKTOP_W, buildTemplateConfig, heading, body, label, button, photo, linkTo } from "./helpers";

export const taxiBookingTemplates: PageTemplate[] = [
  {
    id: "taxi-booking-map-form", pageTypeId: "taxi-booking", name: "Map + Booking Form",
    config: buildTemplateConfig(
      "Taxi Booking",
      {
        height: 900,
        components: [
          photo(0, 0, DESKTOP_W, 900, { bgColor: "#dbeafe", borderRadius: 0 }),
          photo(120, 100, 480, 700, { bgColor: "#ffffff", borderRadius: 16 }),
          heading(160, 140, 400, 44, "Book a Ride", { fontSize: 26 }),
          label(160, 200, 300, 18, "PICKUP LOCATION"),
          photo(160, 224, 400, 48, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(160, 290, 300, 18, "DROP-OFF LOCATION"),
          photo(160, 314, 400, 48, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(160, 380, 300, 18, "VEHICLE TYPE"),
          photo(160, 404, 400, 48, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(160, 480, 400, 56, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
      {
        height: 780,
        components: [
          photo(0, 0, 375, 300, { bgColor: "#dbeafe", borderRadius: 0 }),
          heading(16, 324, 343, 40, "Book a Ride", { fontSize: 22 }),
          label(16, 374, 300, 18, "PICKUP"),
          photo(16, 396, 343, 48, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(16, 456, 300, 18, "DROP-OFF"),
          photo(16, 478, 343, 48, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 550, 343, 52, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
    ),
  },
  {
    id: "taxi-booking-vehicle-select", pageTypeId: "taxi-booking", name: "Vehicle Selection",
    config: buildTemplateConfig(
      "Taxi Booking",
      {
        height: 800,
        components: [
          heading(160, 60, 700, 60, "Choose Your Ride"),
          photo(160, 160, 500, 220, { bgColor: "#f8fafc", borderRadius: 12 }),
          body(180, 320, 300, 24, "Economy · $12", { fontWeight: 600 }),
          photo(710, 160, 500, 220, { bgColor: "#f8fafc", borderRadius: 12 }),
          body(730, 320, 300, 24, "Premium · $22", { fontWeight: 600 }),
          photo(1260, 160, 500, 220, { bgColor: "#f8fafc", borderRadius: 12 }),
          body(1280, 320, 300, 24, "SUV · $30", { fontWeight: 600 }),
          button(160, 440, 300, 56, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
      {
        height: 800,
        components: [
          heading(16, 24, 343, 40, "Choose Your Ride", { fontSize: 22 }),
          photo(16, 80, 343, 140, { bgColor: "#f8fafc", borderRadius: 12 }),
          body(32, 230, 300, 22, "Economy · $12", { fontWeight: 600 }),
          photo(16, 270, 343, 140, { bgColor: "#f8fafc", borderRadius: 12 }),
          body(32, 420, 300, 22, "Premium · $22", { fontWeight: 600 }),
          button(16, 470, 343, 52, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
    ),
  },
  {
    id: "taxi-booking-driver-eta", pageTypeId: "taxi-booking", name: "Driver + ETA Confirm",
    config: buildTemplateConfig(
      "Taxi Booking",
      {
        height: 800,
        components: [
          photo(0, 0, DESKTOP_W, 500, { bgColor: "#dbeafe", borderRadius: 0 }),
          photo(660, 540, 600, 200, { bgColor: "#ffffff", borderRadius: 16 }),
          heading(700, 570, 400, 40, "Driver Assigned", { fontSize: 22 }),
          body(700, 620, 500, 24, "Arriving in 4 minutes"),
          button(700, 660, 300, 52, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
      {
        height: 700,
        components: [
          photo(0, 0, 375, 320, { bgColor: "#dbeafe", borderRadius: 0 }),
          heading(16, 344, 343, 40, "Driver Assigned", { fontSize: 20 }),
          body(16, 390, 343, 24, "Arriving in 4 minutes"),
          button(16, 440, 343, 52, "Confirm Booking", linkTo("booking-confirmation"), { bgColor: "#111827" }),
        ],
      },
    ),
  },
];

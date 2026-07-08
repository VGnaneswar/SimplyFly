export const navigationItems = [
  { label: "Overview", to: "/" },
  { label: "Flights", to: "/flights" },
  { label: "Bookings", to: "/bookings", roles: ["Passenger"] },
  { label: "Profile", to: "/profile" },
  { label: "Manage Flights", to: "/manage-flights", roles: ["Admin", "FlightOwner"] },
  { label: "Admin", to: "/admin", roles: ["Admin"] },
  { label: "Login", to: "/auth", guestOnly: true },
];
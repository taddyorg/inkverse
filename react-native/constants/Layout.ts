// Breakpoints mirror the Tailwind defaults used by the website (sm / md / lg)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
};

// Smallest window side at or above this is a tablet (iPad, Android sw600dp), so a
// phone in landscape is wide but not a tablet
export const TABLET_MIN_SIDE = 600;

// Max content column widths, matching the website's max-w-3xl (page) and max-w-xl (reader)
export const MAX_CONTENT_WIDTH = {
  page: 768,
  reader: 576,
  // Form column for modal / form screens (signup, profile edit), matching the website's max-w-md modals
  form: 448,
  // Page column on iPad, wider than the phone cap so tablet margins stay tight
  tablet: 960,
  // Banner images on wider layouts (landscape, iPad)
  banner: 640,
  // Cover grids on wider layouts (landscape, iPad), matching the website's max-w-6xl
  grid: 1152,
};

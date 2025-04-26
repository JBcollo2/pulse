// src/pages/Organizer.tsx

import React from 'react';
// Import the main Organizer Dashboard component from the organizer directory
import OrganizerDashboard from './organizer/OrganizerDashboard'; // Adjust path if your directories are structured differently

const Manage_organizer: React.FC = () => {
  // This component serves as the entry point for the organizer route.
  // It renders the core Organizer Dashboard.
  return <OrganizerDashboard />;
};

export default Manage_organizer;
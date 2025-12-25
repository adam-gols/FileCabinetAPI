/**
 * Mock data for UI demonstrations
 */

const mockEvents = [
  {
    id: 'event-1',
    name: 'Spring Basketball Tournament',
    date: '2025-03-15',
    location: 'Madison Square Garden',
    status: 'upcoming',
    games: [
      {
        id: 'game-1',
        eventId: 'event-1',
        homeTeam: 'Lakers',
        awayTeam: 'Celtics',
        homeScore: 98,
        awayScore: 102,
        status: 'completed',
        startTime: '19:00',
        period: 'Final'
      },
      {
        id: 'game-2',
        eventId: 'event-1',
        homeTeam: 'Warriors',
        awayTeam: 'Bulls',
        homeScore: 87,
        awayScore: 79,
        status: 'live',
        startTime: '21:30',
        period: '3rd Quarter'
      }
    ]
  },
  {
    id: 'event-2',
    name: 'College Football Championship',
    date: '2025-04-20',
    location: 'Rose Bowl',
    status: 'upcoming',
    games: [
      {
        id: 'game-3',
        eventId: 'event-2',
        homeTeam: 'Trojans',
        awayTeam: 'Bruins',
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
        startTime: '15:00',
        period: 'Pre-game'
      }
    ]
  }
];

const mockStreams = [
  { id: 'main', name: 'Main Stream', status: 'active' },
  { id: 'secondary', name: 'Secondary Stream', status: 'inactive' },
  { id: 'mobile', name: 'Mobile Stream', status: 'active' }
];

const mockNotifications = [
  {
    id: '1',
    type: 'info',
    message: 'Welcome to GOLS UI Demo',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'success',
    message: 'Mock services initialized successfully',
    timestamp: new Date().toISOString()
  }
];

// Make available globally
window.mockEvents = mockEvents;
window.mockStreams = mockStreams;
window.mockNotifications = mockNotifications;

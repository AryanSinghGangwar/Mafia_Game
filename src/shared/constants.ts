export const GAME_CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 20,
  NIGHT_DURATION: 30000,
  DAY_DISCUSSION_DURATION: 60000,
  DAY_VOTING_DURATION: 30000,
  ROLE_REVEAL_DURATION: 5000,
  ANNOUNCEMENT_DURATION: 8000,
  ELIMINATION_RESULT_DURATION: 5000,
  MAX_NAME_LENGTH: 20,
  MAX_MESSAGE_LENGTH: 200,
} as const;

export const PLAYER_COLORS = [
  { name: 'Red', hex: '#c51111' },
  { name: 'Blue', hex: '#132ed1' },
  { name: 'Green', hex: '#117f2d' },
  { name: 'Pink', hex: '#ed54ba' },
  { name: 'Orange', hex: '#ef7d0e' },
  { name: 'Yellow', hex: '#f5f557' },
  { name: 'Black', hex: '#3f474e' },
  { name: 'White', hex: '#d6e0f0' },
  { name: 'Purple', hex: '#6b2fbb' },
  { name: 'Brown', hex: '#71491e' },
  { name: 'Cyan', hex: '#38fedb' },
  { name: 'Lime', hex: '#50ef39' },
] as const;

export const ROLE_INFO: Record<string, { name: string; alignment: string; emoji: string; description: string; nightAction: string }> = {
  mafia: {
    name: 'Mafia',
    alignment: 'Mafia',
    emoji: '🔪',
    description: 'Eliminate town members at night. You know who the other Mafia members are.',
    nightAction: 'Choose a player to eliminate',
  },
  villager: {
    name: 'Villager',
    alignment: 'Town',
    emoji: '👤',
    description: 'You have no special abilities. Use your wits to find the Mafia during the day.',
    nightAction: 'Tap your own avatar to sleep and blend in.',
  },
  doctor: {
    name: 'Doctor',
    alignment: 'Town',
    emoji: '🛡️',
    description: 'Protect one player from elimination each night. You can protect yourself.',
    nightAction: 'Choose a player (or tap yourself) to protect',
  },
  sheriff: {
    name: 'Sheriff',
    alignment: 'Town',
    emoji: '🔍',
    description: 'Investigate one player each night to learn if they are Mafia.',
    nightAction: 'Choose a player to investigate',
  },
};

export const PHASE_LABELS: Record<string, string> = {
  'lobby': 'Lobby',
  'role-reveal': 'Role Reveal',
  'night': 'Night',
  'day-announcement': 'Dawn',
  'day-discussion': 'Town Meeting',
  'day-voting': 'Town Vote',
  'elimination-result': 'Judgment',
  'game-over': 'Game Over',
};

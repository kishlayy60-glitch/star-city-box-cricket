export type PlayerRole = 'All-Rounder' | 'Batsman' | 'Bowler' | 'Wicketkeeper';
export type TShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type BatsmanStyle = 'Right Hand' | 'Left Hand';
export type BowlingStyle = 'Right Arm Fast' | 'Right Arm Spin' | 'Left Arm Fast' | 'Left Arm Spin' | 'None';
export type PlayerStatus = 'registered' | 'verified' | 'in_auction' | 'sold' | 'unsold';
export type PaymentStatus = 'pending' | 'verified' | 'failed';
export type PlayerGrade = 'A' | 'B' | 'C' | 'D';

export interface PlayerStats {
  matches: number;
  runs: number;
  wickets: number;
  highestScore: number;
  strikeRate: number;
  economy: number;
  rating: number; // 1 to 5 stars
  isStarPlayer?: boolean;
}

export interface BidRecord {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: string;
}

export interface Player {
  id: string;
  name: string;
  dob: string;
  mobile: string;
  tshirtName: string;
  tshirtSize: TShirtSize;
  tshirtNumber: string;
  batsmanStyle: BatsmanStyle;
  bowlingStyle: BowlingStyle;
  role: PlayerRole;
  photoUrl: string;
  basePrice: number;
  status: PlayerStatus;
  grade?: PlayerGrade;
  soldPrice?: number;
  soldToTeamId?: string;
  soldToTeamName?: string;
  paymentStatus: PaymentStatus;
  paymentUtr?: string;
  paymentDate?: string;
  registrationDate: string;
  stats: PlayerStats;
  bidHistory: BidRecord[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  captainName: string;
  captainPhoto: string;
  captainMobile: string;
  pin: string;
  color: string;
  secondaryColor: string;
  totalPurse: number;
  remainingPurse: number;
  playersCount: number;
  players: string[]; // Player IDs
}

export interface MatchFixture {
  id: string;
  matchNumber: number;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  date: string;
  time: string;
  venue: string;
  stage: 'League Match' | 'Super 8' | 'Semi Final' | 'Grand Finale';
  status: 'Upcoming' | 'Live' | 'Completed';
  result?: string;
  manOfTheMatch?: string;
}

export interface AuctionState {
  isActive: boolean;
  isPaused: boolean;
  currentPlayerId: string | null;
  currentBid: number;
  currentLeadingTeamId: string | null;
  currentLeadingTeamName: string | null;
  timerSeconds: number;
  auctionPhase: 'IDLE' | 'BIDDING' | 'GOING_ONCE' | 'GOING_TWICE' | 'SOLD' | 'UNSOLD';
  bidsLog: BidRecord[];
  lastUpdate: number;
}

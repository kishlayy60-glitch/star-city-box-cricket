import React, { useState } from 'react';
import { Calendar, Trophy, Clock, MapPin, Users, Search, Shirt, Shield } from 'lucide-react';
import { MatchFixture, Player, Team } from '../types/cricket';

interface TournamentScheduleProps {
  fixtures: MatchFixture[];
  teams: Team[];
  players: Player[];
}

export const TournamentSchedule: React.FC<TournamentScheduleProps> = ({
  fixtures,
  teams,
  players,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'squads'>('schedule');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  const filteredFixtures = fixtures.filter((f) => {
    if (selectedTeamFilter === 'all') return true;
    return f.team1Id === selectedTeamFilter || f.team2Id === selectedTeamFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
            Tournament Information Desk
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Matches Schedule & Team Squad Rosters
          </h2>
          <p className="text-xs text-slate-400">
            Check match dates, opponent fixtures, and player drafting prices.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Match Schedule (कब & किसके साथ)</span>
          </button>

          <button
            onClick={() => setActiveTab('squads')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'squads'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Squads & Player Bids (कौन किस टीम में)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MATCH SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Filter by Team:</span>
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Teams ({teams.length})</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredFixtures.length} of {fixtures.length} matches
            </span>
          </div>

          {/* Fixtures List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFixtures.map((f) => (
              <div
                key={f.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-xl transition space-y-3"
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[11px]">
                      Match #{f.matchNumber}
                    </span>
                    <span className="text-slate-300 font-semibold">{f.stage}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    f.status === 'Live' ? 'bg-red-600 text-white animate-pulse' :
                    f.status === 'Completed' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                  }`}>
                    {f.status}
                  </span>
                </div>

                {/* Teams Clash */}
                <div className="grid grid-cols-11 items-center py-2 text-center">
                  <div className="col-span-5 text-left">
                    <span className="text-sm sm:text-base font-black text-white block">
                      {f.team1Name}
                    </span>
                    <span className="text-[10px] text-slate-400">Team 1</span>
                  </div>

                  <div className="col-span-1 text-center font-black text-amber-400 text-sm">
                    VS
                  </div>

                  <div className="col-span-5 text-right">
                    <span className="text-sm sm:text-base font-black text-white block">
                      {f.team2Name}
                    </span>
                    <span className="text-[10px] text-slate-400">Team 2</span>
                  </div>
                </div>

                {/* Date, Time, Venue */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Date: <strong className="text-white">{f.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Time: <strong className="text-white">{f.time}</strong></span>
                  </div>
                  <div className="col-span-full flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{f.venue}</span>
                  </div>
                </div>

                {f.result && (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 p-2 rounded-xl text-xs text-emerald-300 font-semibold text-center">
                    🏆 Result: {f.result}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: TEAM SQUADS & PLAYER PRICES */}
      {activeTab === 'squads' && (
        <div className="space-y-6">
          
          {/* Search bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search player by name, jersey, or role..."
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm w-full focus:outline-none placeholder:text-slate-500 font-medium"
            />
            {playerSearchQuery && (
              <button
                onClick={() => setPlayerSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Teams Grid with Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((t) => {
              const teamDraftedPlayers = players.filter((p) => p.soldToTeamId === t.id);
              const matchesQuery = teamDraftedPlayers.filter((p) =>
                playerSearchQuery === '' ? true : p.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
              );

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4"
                >
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={t.captainPhoto}
                          alt={t.captainName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-950 text-xs px-1 rounded border border-amber-400">
                          {t.logo}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white font-['Outfit']">
                          {t.name}
                        </h3>
                        <p className="text-xs text-slate-300">
                          Captain: <strong className="text-amber-400">{t.captainName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Purse Remaining</span>
                      <span className="font-mono text-base font-black text-emerald-400">
                        ₹{t.remainingPurse.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Squad Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Players</span>
                      <span className="font-black text-white">{teamDraftedPlayers.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Purse Spent</span>
                      <span className="font-black text-amber-400 font-mono">
                        ₹{(t.totalPurse - t.remainingPurse).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Budget</span>
                      <span className="font-black text-slate-300 font-mono">₹1,00,000</span>
                    </div>
                  </div>

                  {/* Players in this squad */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Drafted Squad Roster ({teamDraftedPlayers.length})
                    </h4>

                    {matchesQuery.length > 0 ? (
                      <div className="space-y-2">
                        {matchesQuery.map((p) => (
                          <div
                            key={p.id}
                            className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-amber-400"
                              />
                              <div>
                                <span className="font-bold text-white block text-sm leading-tight">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.role} • Jersey #{p.tshirtNumber} • {p.batsmanStyle}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Bid Price</span>
                              <span className="font-mono font-black text-amber-400 text-sm">
                                ₹{p.soldPrice?.toLocaleString() || p.basePrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-950/50 rounded-xl text-xs text-slate-500">
                        {playerSearchQuery ? 'No matching player found in this team.' : 'No players drafted yet in auction.'}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};

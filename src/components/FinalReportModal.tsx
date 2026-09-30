import React from 'react';
import { Trophy, Printer, Download, X, Award, CheckCircle2 } from 'lucide-react';
import { MatchFixture, Player, Team } from '../types/cricket';

interface FinalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  teams: Team[];
  fixtures: MatchFixture[];
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  isOpen,
  onClose,
  players,
  teams,
  fixtures,
}) => {
  if (!isOpen) return null;

  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');
  const totalPurseSpent = teams.reduce((acc, t) => acc + (t.totalPurse - t.remainingPurse), 0);
  const totalRegistrationFees = players.filter((p) => p.paymentStatus === 'verified').length * 500;

  // Top Buys
  const topBuys = [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['Player ID', 'Player Name', 'Role', 'Jersey No', 'Status', 'Drafted Team', 'Sold Price (INR)', 'Base Price (INR)', 'Payment UTR', 'Mobile'];
    const rows = players.map((p) => [
      p.id,
      `"${p.name}"`,
      p.role,
      p.tshirtNumber,
      p.status,
      `"${p.soldToTeamName || 'N/A'}"`,
      p.soldPrice || 0,
      p.basePrice,
      p.paymentUtr || 'N/A',
      p.mobile,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StarCity_Auction_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden my-auto text-white print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">
              Official Auction Final Report & Ledger
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={handleDownloadCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          
          {/* Header Banner */}
          <div className="text-center border-b-2 border-amber-400 pb-5">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 print:text-amber-800">
              OFFICIAL TOURNAMENT SUMMARY REPORT
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] mt-1">
              STAR CITY BOX CRICKET LEAGUE 2026-27
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              "Same Ground New Champions" • Report Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 print:bg-slate-100 print:border-slate-300 text-center">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">Total Players Sold</span>
              <span className="text-2xl font-black text-amber-400 print:text-black">{soldPlayers.length}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 print:bg-slate-100 print:border-slate-300 text-center">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">Total Purse Spent</span>
              <span className="text-2xl font-black text-emerald-400 print:text-emerald-700 font-mono">₹{totalPurseSpent.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 print:bg-slate-100 print:border-slate-300 text-center">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">Unsold Pool</span>
              <span className="text-2xl font-black text-rose-400 print:text-rose-700">{unsoldPlayers.length}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 print:bg-slate-100 print:border-slate-300 text-center">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">Registration Fees Collected</span>
              <span className="text-2xl font-black text-blue-400 print:text-blue-700 font-mono">₹{totalRegistrationFees.toLocaleString()}</span>
            </div>
          </div>

          {/* TOP 5 EXPENSIVE BUYS */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-amber-800 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Top Buys & Highest Bids
            </h4>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 print:border-slate-300 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 print:bg-slate-200 text-slate-400 print:text-slate-700 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Player Name</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Drafted Team</th>
                    <th className="p-2.5 text-right">Sold Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {topBuys.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold font-mono text-amber-400">#{idx + 1}</td>
                      <td className="p-2.5 font-bold">{p.name}</td>
                      <td className="p-2.5 text-slate-400 print:text-slate-600">{p.role}</td>
                      <td className="p-2.5 font-semibold text-white print:text-black">{p.soldToTeamName}</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-400 print:text-emerald-700">₹{p.soldPrice?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPLETE FRANCHISE TEAM SQUADS BREAKDOWN */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-amber-800 mb-3">
              Team-Wise Final Rosters & Financials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((t) => {
                const teamSquad = players.filter((p) => p.soldToTeamId === t.id);
                const spent = t.totalPurse - t.remainingPurse;
                return (
                  <div key={t.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:border-slate-300 print:bg-white text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-200">
                      <div>
                        <span className="font-black text-sm text-white print:text-black block">{t.logo} {t.name}</span>
                        <span className="text-[10px] text-slate-400 print:text-slate-600">Captain: {t.captainName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 print:text-emerald-700 block">Purse: ₹{t.remainingPurse.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">Spent: ₹{spent.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      {teamSquad.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1 text-[11px] border-b border-slate-900 print:border-slate-100">
                          <span className="font-medium text-slate-200 print:text-slate-800">
                            {p.name} ({p.role}, #{p.tshirtNumber})
                          </span>
                          <span className="font-mono font-bold text-amber-400 print:text-amber-800">
                            ₹{p.soldPrice?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {teamSquad.length === 0 && (
                        <span className="text-[11px] text-slate-500 italic block py-1">No players drafted yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tournament Slogan Footer */}
          <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400 print:text-slate-600">
            <p className="font-bold text-amber-400 print:text-amber-800">
              STAR CITY BOX CRICKET LEAGUE 2026-27 • OFFICIAL REPORT
            </p>
            <p className="text-[10px] mt-0.5">
              Good Players Win Matches, Great Teams Win Leagues • Authorized by Tournament Committee
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

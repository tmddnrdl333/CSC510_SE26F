import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Leaderboard.css';

type LeaderboardScope = 'global' | 'friends';

interface LeaderboardEntry {
  userId: string;
  name: string | null;
  score: number;
  rank: number;
  points: number;
  badgeTierCount: number;
  donatedMeals: number;
}

interface LeaderboardResponse {
  scope: LeaderboardScope;
  entries: LeaderboardEntry[];
}

const defaultResponse: LeaderboardResponse = {
  scope: 'global',
  entries: [],
};

// Loading/empty/error states are polished in piece 5.
const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.id;
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data = defaultResponse, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', scope],
    enabled: !!customerId,
    queryFn: async () => {
      const response = await api.get('/leaderboard', { params: scope === 'friends' ? { scope } : {} });
      return response.data as LeaderboardResponse;
    },
  });

  return (
    <section className="leaderboard">
      <div className="leaderboard-header">
        <div>
          <p className="leaderboard-eyebrow">Friendly competition</p>
          <h2>Leaderboard</h2>
          <p className="leaderboard-subtitle">
            See how you stack up on points, badges, and donation impact.
          </p>
        </div>
        <div className="leaderboard-toggle" role="tablist" aria-label="Leaderboard scope">
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'global'}
            className={scope === 'global' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setScope('global')}
          >
            Global
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'friends'}
            className={scope === 'friends' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setScope('friends')}
          >
            Friends
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading leaderboard...</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
              <th>Points</th>
              <th>Badge tiers</th>
              <th>Donated meals</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr
                key={entry.userId}
                className={entry.userId === customerId ? 'leaderboard-row current-user' : 'leaderboard-row'}
              >
                <td>{entry.rank}</td>
                <td>{entry.name || entry.userId}</td>
                <td>{entry.score}</td>
                <td>{entry.points}</td>
                <td>{entry.badgeTierCount}</td>
                <td>{entry.donatedMeals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default Leaderboard;

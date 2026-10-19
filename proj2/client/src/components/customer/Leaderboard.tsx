import React from 'react';
import './Leaderboard.css';

// Skeleton (issue #32, piece 2). Data fetching + rendering lands in piece 3;
// the Global/Friends toggle in piece 4; loading/empty/error states in piece 5.
const Leaderboard: React.FC = () => {
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
      </div>
    </section>
  );
};

export default Leaderboard;

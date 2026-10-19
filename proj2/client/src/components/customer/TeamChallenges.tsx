// M3 issue #18 — team + weekly challenge progress page.
// Data source: GET /api/teams/me, GET /api/challenges, POST /api/challenges/:id/claim
// (all M3 routes; identity via the temporary x-test-user-id header added in
// services/api.ts until M1's JWT middleware replaces the stub).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { api } from '../../services/api';
import './TeamChallenges.css';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
}

interface Challenge {
  definitionId: string;
  label: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  percent: number;
  achieved: boolean;
  status: 'active' | 'rewarded';
  claimable: boolean;
  reward: { type: string; amount?: number; badgeId?: string };
}

const rewardText = (reward: Challenge['reward']) =>
  reward.type === 'donatedMeals'
    ? `🍲 ${reward.amount} donated meals`
    : `🏅 "${reward.badgeId}" badge for every member`;

const TeamChallenges: React.FC = () => {
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['myTeam'] });
    queryClient.invalidateQueries({ queryKey: ['teamChallenges'] });
  };

  const { data: team, isLoading: teamLoading } = useQuery<Team | null>({
    queryKey: ['myTeam'],
    queryFn: async () => (await api.get('/teams/me')).data.team,
  });

  const { data: challengeData } = useQuery({
    queryKey: ['teamChallenges'],
    queryFn: async () => (await api.get('/challenges')).data,
    enabled: !!team,
  });

  const onError = (error: any) =>
    setFeedback(error?.response?.data?.error || 'Something went wrong');

  const createTeam = useMutation({
    mutationFn: async () => api.post('/teams', { name: teamName }),
    onSuccess: () => { setFeedback(null); setTeamName(''); refresh(); },
    onError,
  });

  const joinTeam = useMutation({
    mutationFn: async () => api.post('/teams/join', { teamId: joinTeamId.trim() }),
    onSuccess: () => { setFeedback(null); setJoinTeamId(''); refresh(); },
    onError,
  });

  const leaveTeam = useMutation({
    mutationFn: async () => api.post('/teams/leave'),
    onSuccess: () => { setFeedback(null); refresh(); },
    onError,
  });

  const claim = useMutation({
    mutationFn: async (definitionId: string) =>
      api.post(`/challenges/${definitionId}/claim`),
    onSuccess: (res) => {
      const { rewarded, reward } = res.data;
      setFeedback(rewarded ? `Reward granted: ${rewardText(reward)} 🎉` : 'Already claimed by your team');
      refresh();
    },
    onError,
  });

  if (teamLoading) return <div className="team-challenges"><p>Loading…</p></div>;

  if (!team) {
    return (
      <div className="team-challenges">
        <h2>🤝 Team Challenges</h2>
        <p className="tc-intro">
          Form a team with your friends and take on weekly challenges together —
          hitting a goal donates extra meals or earns badges for everyone.
        </p>
        {feedback && <div className="tc-feedback">{feedback}</div>}
        <div className="tc-forms">
          <div className="tc-form-card">
            <h3>Create a team</h3>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
            />
            <button disabled={!teamName.trim() || createTeam.isPending} onClick={() => createTeam.mutate()}>
              Create
            </button>
          </div>
          <div className="tc-form-card">
            <h3>Join a team</h3>
            <p className="tc-hint">
              Ask the team owner for their Team ID. You must be their accepted
              friend to join.
            </p>
            <input
              value={joinTeamId}
              onChange={(e) => setJoinTeamId(e.target.value)}
              placeholder="Team ID"
            />
            <button disabled={!joinTeamId.trim() || joinTeam.isPending} onClick={() => joinTeam.mutate()}>
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  const challenges: Challenge[] = challengeData?.challenges || [];

  return (
    <div className="team-challenges">
      <div className="tc-team-card">
        <div>
          <h2>🐺 {team.name}</h2>
          <p className="tc-team-meta">
            {team.memberIds.length}/10 members · Week {challengeData?.weekKey || '…'}
          </p>
          <p className="tc-team-id">
            Team ID (share with friends): <code>{team.id}</code>
          </p>
        </div>
        <button className="tc-leave" disabled={leaveTeam.isPending} onClick={() => leaveTeam.mutate()}>
          Leave team
        </button>
      </div>

      {feedback && <div className="tc-feedback">{feedback}</div>}

      <h3>This week&apos;s challenges</h3>
      <div className="tc-challenge-list">
        {challenges.map((c) => (
          <div key={c.definitionId} className={`tc-challenge ${c.status}`}>
            <div className="tc-challenge-head">
              <span className="tc-icon">{c.icon}</span>
              <div>
                <div className="tc-label">{c.label}</div>
                <div className="tc-desc">{c.description}</div>
              </div>
              {c.status === 'rewarded' ? (
                <span className="tc-chip rewarded">✓ Rewarded</span>
              ) : c.claimable ? (
                <button className="tc-claim" disabled={claim.isPending} onClick={() => claim.mutate(c.definitionId)}>
                  Claim reward
                </button>
              ) : (
                <span className="tc-chip active">In progress</span>
              )}
            </div>
            <div className="tc-bar">
              <div
                className={`tc-bar-fill ${c.status === 'rewarded' ? 'done' : ''}`}
                style={{ width: `${c.percent}%` }}
              />
            </div>
            <div className="tc-bar-meta">
              <span>{c.progress} / {c.target}</span>
              <span>{rewardText(c.reward)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamChallenges;

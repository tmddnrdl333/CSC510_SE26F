// M2: Leaderboard page client test (issue #32).
// Source under test: client/src/components/customer/Leaderboard.tsx
//
// Run:  cd proj2/client && CI=true npx react-scripts test src/components/customer/Leaderboard.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Leaderboard from './Leaderboard';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({
  api: { get: jest.fn() },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'alice', profile: { name: 'Alice' } } }),
}));

const mockedGet = api.get as jest.Mock;

const globalResponse = {
  scope: 'global',
  entries: [
    { userId: 'alice', name: 'Alice', score: 138, rank: 1, points: 120, badgeTierCount: 4, donatedMeals: 2 },
    { userId: 'bob', name: 'Bob', score: 49, rank: 2, points: 40, badgeTierCount: 2, donatedMeals: 1 },
  ],
};

const friendsResponseWithFriend = {
  scope: 'friends',
  entries: [
    { userId: 'alice', name: 'Alice', score: 138, rank: 1, points: 120, badgeTierCount: 4, donatedMeals: 2 },
    { userId: 'bob', name: 'Bob', score: 49, rank: 2, points: 40, badgeTierCount: 2, donatedMeals: 1 },
  ],
};

const friendsResponseNoFriends = {
  scope: 'friends',
  entries: [
    { userId: 'alice', name: 'Alice', score: 138, rank: 1, points: 120, badgeTierCount: 4, donatedMeals: 2 },
  ],
};

function renderLeaderboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Leaderboard />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockedGet.mockReset();
});

describe('Leaderboard', () => {
  test('renders entries for the default (global) scope, highlighting the current user', async () => {
    mockedGet.mockResolvedValue({ data: globalResponse });

    renderLeaderboard();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('138')).toBeInTheDocument(); // Alice's score
    expect(screen.getByText('49')).toBeInTheDocument(); // Bob's score

    const aliceRow = screen.getByText('Alice').closest('tr');
    expect(aliceRow).toHaveClass('current-user');
    const bobRow = screen.getByText('Bob').closest('tr');
    expect(bobRow).not.toHaveClass('current-user');

    expect(mockedGet).toHaveBeenCalledWith('/leaderboard', { params: {} });
  });

  test('the Friends toggle switches scope and re-fetches with ?scope=friends', async () => {
    mockedGet.mockImplementation((_url: string, config?: { params?: { scope?: string } }) => {
      if (config?.params?.scope === 'friends') {
        return Promise.resolve({ data: friendsResponseWithFriend });
      }
      return Promise.resolve({ data: globalResponse });
    });

    renderLeaderboard();
    await screen.findByText('Alice'); // initial global load settled

    await userEvent.click(screen.getByRole('tab', { name: 'Friends' }));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/leaderboard', { params: { scope: 'friends' } });
    });
    expect(screen.getByRole('tab', { name: 'Friends' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Global' })).toHaveAttribute('aria-selected', 'false');
  });

  test('empty state: friends scope with no accepted friends shows the add-friends message', async () => {
    mockedGet.mockImplementation((_url: string, config?: { params?: { scope?: string } }) => {
      if (config?.params?.scope === 'friends') {
        return Promise.resolve({ data: friendsResponseNoFriends });
      }
      return Promise.resolve({ data: globalResponse });
    });

    renderLeaderboard();
    await screen.findByText('Alice'); // initial global load settled

    await userEvent.click(screen.getByRole('tab', { name: 'Friends' }));

    expect(await screen.findByText('Add friends to see them here.')).toBeInTheDocument();
    // the lone caller row should not render as a table when the empty state is shown
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Cart from '../components/customer/Cart';
import CustomerHome from '../components/customer/CustomerHome';
import Leaderboard from '../components/customer/Leaderboard';
import Orders from '../components/customer/Orders';
import Profile from '../components/customer/Profile';
import RestaurantList from '../components/customer/RestaurantList';
import TeamChallenges from '../components/customer/TeamChallenges';
import { useAuth } from '../contexts/AuthContext';
import VoiceCommandManager from '../features/voice/components/VoiceCommandManager';
import { api } from '../services/api';
import './Dashboard.css';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: points } = useQuery({
    queryKey: ['customerPoints', user?.id],
    queryFn: async () => {
      const response = await api.get(`/points?customerId=${user?.id}`);
      return response.data.points;
    },
    enabled: !!user
  });

  const { data: orders } = useQuery({
    queryKey: ['customerOrders', user?.id],
    queryFn: async () => {
      const response = await api.get(`/orders/customer?customerId=${user?.id}`);
      return response.data.orders;
    },
    enabled: !!user
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.profile?.name || 'Customer'}! 🐺</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{points?.availablePoints || 0}</div>
              <div className="stat-label">Points Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{orders?.length || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<TeamChallenges />} />
        </Routes>
      </div>
      
      <VoiceCommandManager />
    </div>
  );
};

export default CustomerDashboard;

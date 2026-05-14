import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <Users color="var(--primary-color)" size={24} />
          <div className="stat-title">Total Customers</div>
          <div className="stat-value">{stats.totalCustomers}</div>
        </div>
        <div className="glass-card stat-card">
          <Clock color="var(--warning-color)" size={24} />
          <div className="stat-title">Pending Bills</div>
          <div className="stat-value">{stats.pendingBillsCount}</div>
          <div className="stat-title" style={{ marginTop: '8px' }}>Amount: {stats.pendingBillsTotal} RWF</div>
        </div>
        <div className="glass-card stat-card">
          <CheckCircle color="var(--success-color)" size={24} />
          <div className="stat-title">Paid Bills</div>
          <div className="stat-value">{stats.paidBillsCount}</div>
          <div className="stat-title" style={{ marginTop: '8px' }}>Amount: {stats.paidBillsTotal} RWF</div>
        </div>
      </div>
    </div>
  );
}

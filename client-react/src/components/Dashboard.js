import React from 'react';
import './Dashboard.css';

const Dashboard = ({ dashboard, loading }) => {
  return (
    <div className="dashboard">
      <h2>Overview</h2>
      <div className="stats-grid">
        {loading ? (
          <div className="loading-message">Loading statistics...</div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-number">{dashboard.characters?.count || 0}</div>
              <div className="stat-label">Characters</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboard.guilds?.count || 0}</div>
              <div className="stat-label">Guilds</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">3</div>
              <div className="stat-label">Services</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

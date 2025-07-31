import './StatusBar.css';

const StatusBar = ({ health }) => {
  const getStatusClass = (status) => {
    return status === 'running' || status === 'connected' ? 'connected' : 'disconnected';
  };

  const getStatusText = (status, service) => {
    if (service === 'gateway') {
      return status === 'running' ? 'Online' : 'Desconectado';
    }
    return status === 'connected' ? 'Conectado' : 'Indisponível';
  };

  return (
    <div className="status-bar">
      <div className="status-grid">
        <div className={`status-card ${getStatusClass(health.gateway)}`}>
          <div className="status-icon gateway"></div>
          <div className="status-info">
            <h3>Portal</h3>
            <span>{getStatusText(health.gateway, 'gateway')}</span>
          </div>
        </div>
        
        <div className={`status-card ${getStatusClass(health.services?.rest)}`}>
          <div className="status-icon heroes"></div>
          <div className="status-info">
            <h3>Heróis</h3>
            <span>{getStatusText(health.services?.rest, 'rest')}</span>
          </div>
        </div>
        
        <div className={`status-card ${getStatusClass(health.services?.soap)}`}>
          <div className="status-icon guilds"></div>
          <div className="status-info">
            <h3>Guildas</h3>
            <span>{getStatusText(health.services?.soap, 'soap')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;

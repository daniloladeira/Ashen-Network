import React, { useState } from 'react';

const GuildSection = ({ 
  guilds, 
  guildMembers,
  guildForm, 
  setGuildForm, 
  createGuild, 
  loadGuilds, 
  joinForm,
  setJoinForm,
  joinGuild,
  characters,
  messages, 
  loading 
}) => {
  const [expandedGuilds, setExpandedGuilds] = useState({});

  const toggleGuildMembers = (guildId) => {
    setExpandedGuilds(prev => ({
      ...prev,
      [guildId]: !prev[guildId]
    }));
  };
  return (
    <div className="section">
      <h2>Guildas</h2>
      
      <form onSubmit={createGuild} className="form-container">
        <div className="form-group">
          <label>Criar uma nova guilda:</label>
          <input 
            type="text" 
            value={guildForm.name}
            onChange={(e) => setGuildForm({...guildForm, name: e.target.value})}
            placeholder="Nome da guilda"
            className="form-input"
          />
          <input 
            type="text" 
            value={guildForm.description}
            onChange={(e) => setGuildForm({...guildForm, description: e.target.value})}
            placeholder="Descrição da guilda"
            className="form-input"
          />
          <select 
            value={guildForm.leader}
            onChange={(e) => setGuildForm({...guildForm, leader: e.target.value})}
            className="form-input"
          >
            <option value="">Selecione um líder</option>
            {characters.map(char => (
              <option key={char.id} value={char.name}>{char.name} (Nível {char.level})</option>
            ))}
          </select>
          <div className="button-group">
            <button className="btn btn-primary" type="submit">
              Criar Guilda
            </button>
            <button 
              className="btn btn-secondary" 
              type="button" 
              onClick={loadGuilds}
            >
              Atualizar
            </button>
          </div>
        </div>
      </form>

      {messages.guilds && (
        <div className={`message ${messages.guilds.type}`}>
          {messages.guilds.message}
        </div>
      )}

      {/* Seção para associar heróis às guildas */}
      <div className="guild-join-section">
        <h3>Associar Herói à Guilda</h3>
        <form onSubmit={joinGuild} className="form-container">
          <div className="form-group">
            <select 
              value={joinForm.character_name}
              onChange={(e) => setJoinForm({...joinForm, character_name: e.target.value})}
              className="form-input"
            >
              <option value="">Selecione um herói</option>
              {characters.map(char => (
                <option key={char.id} value={char.name}>{char.name} (Nível {char.level})</option>
              ))}
            </select>
            <select 
              value={joinForm.guild_id}
              onChange={(e) => setJoinForm({...joinForm, guild_id: e.target.value})}
              className="form-input"
            >
              <option value="">Selecione uma guilda</option>
              {guilds.map(guild => (
                <option key={guild.id} value={guild.id}>{guild.name}</option>
              ))}
            </select>
            <div className="button-group">
              <button className="btn btn-primary" type="submit">
                Associar à Guilda
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="guilds-table-container">
        {loading ? (
          <div className="loading-message">Procurando suas guildas...</div>
        ) : guilds.length === 0 ? (
          <div className="empty-message">Você ainda não criou nenhuma guilda</div>
        ) : (
          <table className="guilds-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Líder</th>
                <th>Membros</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {guilds.map(guild => (
                <tr key={guild.id} className="guild-row">
                  <td className="guild-name">{guild.name}</td>
                  <td className="guild-description">{guild.description}</td>
                  <td className="guild-leader">{guild.leader}</td>
                  <td className="guild-members-count">{guild.member_count}</td>
                  <td className="guild-actions">
                    <button 
                      className="btn-small btn-secondary"
                      onClick={() => toggleGuildMembers(guild.id)}
                      disabled={!guildMembers[guild.id] || guildMembers[guild.id].length === 0}
                    >
                      {guildMembers[guild.id] && guildMembers[guild.id].length > 0 
                        ? (expandedGuilds[guild.id] ? 'Ocultar Membros' : 'Ver Membros')
                        : 'Sem Membros'
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Tabelas de membros expansíveis */}
        {guilds.map(guild => (
          expandedGuilds[guild.id] && guildMembers[guild.id] && guildMembers[guild.id].length > 0 && (
            <div key={`members-${guild.id}`} className="members-table-container">
              <h4>Membros da Guilda: {guild.name}</h4>
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Nome do Personagem</th>
                    <th>Data de Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {guildMembers[guild.id].map(member => (
                    <tr key={member.id} className="member-row">
                      <td className="member-name">{member.character_name}</td>
                      <td className="member-date">{member.join_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default GuildSection;

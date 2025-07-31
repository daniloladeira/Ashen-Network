import React from 'react';

const CharacterSection = ({ 
  characters, 
  charForm, 
  setCharForm, 
  createCharacter, 
  loadCharacters, 
  messages, 
  loading 
}) => {
  return (
    <div className="section character-section">
      <h2>Seus Heróis</h2>
      
      <form onSubmit={createCharacter} className="form-container">
        <div className="form-group">
          <label>Criar um novo herói:</label>
          <input 
            type="text" 
            value={charForm.name}
            onChange={(e) => setCharForm({...charForm, name: e.target.value})}
            placeholder="Nome do seu herói"
            className="form-input"
          />
          <input 
            type="number" 
            value={charForm.level}
            onChange={(e) => setCharForm({...charForm, level: e.target.value})}
            placeholder="Nível inicial" 
            min="1" 
            max="99"
            className="form-input"
          />
          <div className="button-group">
            <button className="btn btn-primary" type="submit">
              Criar Herói
            </button>
            <button 
              className="btn btn-secondary" 
              type="button" 
              onClick={loadCharacters}
            >
              Atualizar
            </button>
          </div>
        </div>
      </form>

      {messages.characters && (
        <div className={`message ${messages.characters.type}`}>
          {messages.characters.message}
        </div>
      )}

      <div className="characters-table-container">
        {loading ? (
          <div className="loading-message">Procurando seus heróis...</div>
        ) : characters.length === 0 ? (
          <div className="empty-message">Você ainda não criou nenhum herói</div>
        ) : (
          <table className="characters-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Herói</th>
                <th>Nível</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(char => (
                <tr key={char.id} className="character-row">
                  <td className="character-id">#{char.id}</td>
                  <td className="character-name">{char.name}</td>
                  <td className="character-level">
                    <span className="level-badge">Nível {char.level}</span>
                  </td>
                  <td className="character-status">
                    <span className="status-active">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CharacterSection;

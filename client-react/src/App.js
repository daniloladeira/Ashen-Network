import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import Dashboard from './components/Dashboard';
import CharacterSection from './components/CharacterSection';
import GuildSection from './components/GuildSection';

const GATEWAY_URL = 'http://localhost:4000';

function App() {
  const [health, setHealth] = useState({});
  const [dashboard, setDashboard] = useState({});
  const [characters, setCharacters] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [guildMembers, setGuildMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState({ characters: '', guilds: '' });

  // Character form
  const [charForm, setCharForm] = useState({ name: '', level: '' });
  
  // Guild forms
  const [guildForm, setGuildForm] = useState({ name: '', description: '', leader: '' });
  const [joinForm, setJoinForm] = useState({ guild_id: '', character_name: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      checkHealth(),
      loadDashboard(),
      loadCharacters(),
      loadGuilds()
    ]);
    setLoading(false);
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/gateway/health`);
      setHealth(response.data);
    } catch (error) {
      console.error('Erro ao verificar health:', error);
      setHealth({ 
        gateway: 'error', 
        services: { rest: 'error', soap: 'error' } 
      });
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/gateway/dashboard`);
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/gateway/characters`);
      setCharacters(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    }
  };

  const loadGuilds = async () => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/gateway/guilds`);
      const guildData = response.data.data;
      setGuilds(guildData);
      
      // Carregar membros de cada guilda
      guildData.forEach(guild => {
        loadGuildMembers(guild.id);
      });
    } catch (error) {
      console.error('Erro ao carregar guildas:', error);
    }
  };

  const loadGuildMembers = async (guildId) => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/gateway/guilds/${guildId}/members`);
      setGuildMembers(prev => ({
        ...prev,
        [guildId]: response.data.data
      }));
    } catch (error) {
      console.error(`Erro ao carregar membros da guilda ${guildId}:`, error);
    }
  };

  const createCharacter = async (e) => {
    e.preventDefault();
    if (!charForm.name || !charForm.level) {
      showMessage('characters', 'Por favor, preencha o nome e o nível do herói', 'error');
      return;
    }

    const level = parseInt(charForm.level);
    if (level < 1 || level > 99) {
      showMessage('characters', 'O nível deve estar entre 1 e 99', 'error');
      return;
    }

    try {
      const response = await axios.post(`${GATEWAY_URL}/api/gateway/characters`, {
        name: charForm.name,
        level: level
      });

      showMessage('characters', `🎉 O herói "${charForm.name}" foi criado com sucesso!`, 'success');
      setCharForm({ name: '', level: '' });
      loadCharacters();
      loadDashboard();
    } catch (error) {
      showMessage('characters', error.response?.data?.error || 'Não foi possível criar o herói', 'error');
    }
  };

  const createGuild = async (e) => {
    e.preventDefault();
    if (!guildForm.name || !guildForm.description || !guildForm.leader) {
      showMessage('guilds', 'Por favor, preencha todos os campos para fundar a guilda', 'error');
      return;
    }

    try {
      await axios.post(`${GATEWAY_URL}/api/gateway/guilds`, guildForm);
      showMessage('guilds', `🎉 A guilda "${guildForm.name}" foi fundada com sucesso!`, 'success');
      setGuildForm({ name: '', description: '', leader: '' });
      loadGuilds();
      loadDashboard();
    } catch (error) {
      showMessage('guilds', error.response?.data?.error || 'Não foi possível fundar a guilda', 'error');
    }
  };

  const joinGuild = async (e) => {
    e.preventDefault();
    if (!joinForm.guild_id || !joinForm.character_name) {
      showMessage('guilds', 'Por favor, escolha uma guilda e digite o nome do herói', 'error');
      return;
    }

    try {
      await axios.post(`${GATEWAY_URL}/api/gateway/guilds/join`, {
        guild_id: joinForm.guild_id,
        character_name: joinForm.character_name
      });
      showMessage('guilds', `🎉 ${joinForm.character_name} entrou na guilda com sucesso!`, 'success');
      setJoinForm({ guild_id: '', character_name: '' });
      loadGuilds();
      loadGuildMembers();
    } catch (error) {
      console.error('Join guild error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Não foi possível entrar na guilda';
      showMessage('guilds', errorMessage, 'error');
    }
  };

  const showMessage = (section, message, type) => {
    setMessages(prev => ({ ...prev, [section]: { message, type } }));
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [section]: '' }));
    }, 5000);
  };

  const getStatusIcon = (status) => {
    return status === 'running' || status === 'connected' ? '●' : '●';
  };

  const getStatusText = (status, service) => {
    if (service === 'gateway') {
      return status === 'running' ? 'Online' : 'Desconectado';
    }
    return status === 'connected' ? 'Conectado' : 'Indisponível';
  };

  return (
    <div className="app">
      <Header />
      
      <div className="container">
        <StatusBar health={health} />
        
        <Dashboard 
          dashboard={dashboard} 
          loading={loading} 
        />

        <div className="sections">
          <CharacterSection
            characters={characters}
            charForm={charForm}
            setCharForm={setCharForm}
            createCharacter={createCharacter}
            loadCharacters={loadCharacters}
            messages={messages}
            loading={loading}
          />
          
          <GuildSection
            guilds={guilds}
            guildMembers={guildMembers}
            guildForm={guildForm}
            setGuildForm={setGuildForm}
            createGuild={createGuild}
            loadGuilds={loadGuilds}
            joinForm={joinForm}
            setJoinForm={setJoinForm}
            joinGuild={joinGuild}
            characters={characters}
            messages={messages}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

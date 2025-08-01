const express = require('express');
const cors = require('cors');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// URLs dos serviços
const REST_API_URL = 'http://localhost:3001';
const SOAP_SERVICE_URL = 'http://localhost:8000/soap';

// Função auxiliar para parsing SOAP simplificado
function parseSoapResponse(soapResponse, tagName) {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(soapResponse)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function parseGuildFromSoap(guildXml) {
  const id = guildXml.match(/<id>(\d+)<\/id>/)?.[1];
  const name = guildXml.match(/<name>(.*?)<\/name>/)?.[1];
  const description = guildXml.match(/<description>(.*?)<\/description>/)?.[1];
  const leader = guildXml.match(/<leader>(.*?)<\/leader>/)?.[1];
  const member_count = guildXml.match(/<member_count>(\d+)<\/member_count>/)?.[1];
  
  if (id && name) {
    return {
      id: parseInt(id),
      name,
      description,
      leader,
      member_count: parseInt(member_count || 0)
    };
  }
  return null;
}

// Função para fazer requisições SOAP
async function soapRequest(operation, body = '') {
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:${operation}>
            ${body}
        </tns:${operation}>
    </soap:Body>
</soap:Envelope>`;

  try {
    const response = await axios.post(SOAP_SERVICE_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `http://ashennetwork.soap/guild/${operation}`
      },
      validateStatus: function (status) {
        // Aceitar status 500 porque SOAP Faults retornam 500
        return status >= 200 && status < 600;
      }
    });
    
    // Verificar se há SOAP Fault na resposta
    if (response.data.includes('<soap:Fault>')) {
      const faultString = response.data.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] || 'SOAP Fault occurred';
      throw new Error(faultString);
    }
    
    return response.data;
  } catch (error) {
    // Se error.response existe, verificar SOAP Fault
    if (error.response && error.response.data && error.response.data.includes('<soap:Fault>')) {
      const faultString = error.response.data.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] || 'SOAP Fault occurred';
      throw new Error(faultString);
    }
    throw new Error(`SOAP Error: ${error.message}`);
  }
}

// Middleware para verificar conexão SOAP
const checkSoapConnection = async (req, res, next) => {
  try {
    await axios.get('http://localhost:8000/?wsdl');
    next();
  } catch (error) {
    return res.status(503).json({
      error: 'SOAP service unavailable',
      message: 'Please ensure the SOAP server is running on port 8000',
      links: [
        { rel: 'retry', href: '/api/gateway/health' }
      ]
    });
  }
};

// ============ ROTAS DO GATEWAY ============

// Health check e informações do gateway
app.get('/api/gateway/health', async (req, res) => {
  const health = {
    gateway: 'running',
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Testa REST API
  try {
    await axios.get(`${REST_API_URL}/api/characters`);
    health.services.rest = 'connected';
  } catch {
    health.services.rest = 'disconnected';
  }

  // Testa SOAP service
  try {
    await axios.get('http://localhost:8000/?wsdl');
    health.services.soap = 'connected';
  } catch {
    health.services.soap = 'disconnected';
  }

  res.json({
    ...health,
    links: [
      { rel: 'self', href: '/api/gateway/health' },
      { rel: 'characters', href: '/api/gateway/characters' },
      { rel: 'guilds', href: '/api/gateway/guilds' },
      { rel: 'docs', href: '/api-docs' }
    ]
  });
});

// ============ PROXY PARA REST API (Characters & Items) ============

// Listar personagens (REST)
app.get('/api/gateway/characters', async (req, res) => {
  try {
    const response = await axios.get(`${REST_API_URL}/api/characters`);
    const characters = response.data;

    // Adiciona links do gateway (HATEOAS)
    const enhancedCharacters = characters.map(char => ({
      ...char,
      links: [
        ...char.links,
        { rel: 'gateway', href: `/api/gateway/characters/${char.id}` },
        { rel: 'guilds', href: '/api/gateway/guilds' }
      ]
    }));

    res.json({
      data: enhancedCharacters,
      source: 'REST API',
      links: [
        { rel: 'self', href: '/api/gateway/characters' },
        { rel: 'create', href: '/api/gateway/characters', method: 'POST' },
        { rel: 'guilds', href: '/api/gateway/guilds' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch characters from REST API',
      details: error.message,
      links: [
        { rel: 'retry', href: '/api/gateway/characters' },
        { rel: 'health', href: '/api/gateway/health' }
      ]
    });
  }
});

// Criar personagem (REST)
app.post('/api/gateway/characters', async (req, res) => {
  try {
    const response = await axios.post(`${REST_API_URL}/api/characters`, req.body);
    const character = response.data;

    res.status(201).json({
      data: character,
      source: 'REST API',
      links: [
        { rel: 'self', href: `/api/gateway/characters/${character.id}` },
        { rel: 'items', href: `/api/gateway/characters/${character.id}/items` },
        { rel: 'join-guild', href: '/api/gateway/guilds/join', method: 'POST' }
      ]
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create character',
      details: error.response?.data || error.message,
      links: [
        { rel: 'retry', href: '/api/gateway/characters', method: 'POST' }
      ]
    });
  }
});

// Itens do personagem (REST)
app.get('/api/gateway/characters/:id/items', async (req, res) => {
  try {
    const response = await axios.get(`${REST_API_URL}/api/characters/${req.params.id}/items`);
    const data = response.data;

    res.json({
      data,
      source: 'REST API',
      links: [
        { rel: 'self', href: `/api/gateway/characters/${req.params.id}/items` },
        { rel: 'character', href: `/api/gateway/characters/${req.params.id}` },
        { rel: 'add-item', href: `/api/gateway/characters/${req.params.id}/items`, method: 'POST' }
      ]
    });
  } catch (error) {
    res.status(404).json({
      error: 'Character or items not found',
      details: error.response?.data || error.message
    });
  }
});

// ============ PROXY PARA SOAP SERVICE (Guilds) ============

// Listar todas as guildas (SOAP)
app.get('/api/gateway/guilds', checkSoapConnection, async (req, res) => {
  try {
    const soapResponse = await soapRequest('get_all_guilds');
    
    // Parse da resposta SOAP para extrair guildas
    const guilds = [];
    const guildMatches = soapResponse.match(/<guild>[\s\S]*?<\/guild>/g);
    
    if (guildMatches) {
      guildMatches.forEach(guildXml => {
        const guild = parseGuildFromSoap(guildXml);
        if (guild) guilds.push(guild);
      });
    }

    res.json({
      data: guilds,
      source: 'SOAP Service',
      links: [
        { rel: 'self', href: '/api/gateway/guilds' },
        { rel: 'create', href: '/api/gateway/guilds', method: 'POST' },
        { rel: 'characters', href: '/api/gateway/characters' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch guilds from SOAP service',
      details: error.message,
      links: [
        { rel: 'retry', href: '/api/gateway/guilds' },
        { rel: 'health', href: '/api/gateway/health' }
      ]
    });
  }
});

// Buscar guilda por ID (SOAP)
app.get('/api/gateway/guilds/:id', checkSoapConnection, async (req, res) => {
  try {
    const soapBody = `<guild_id>${req.params.id}</guild_id>`;
    const soapResponse = await soapRequest('get_guild_by_id', soapBody);
    
    // Parse da resposta
    const id = soapResponse.match(/<id>(\d+)<\/id>/)?.[1];
    const name = soapResponse.match(/<name>(.*?)<\/name>/)?.[1];
    const description = soapResponse.match(/<description>(.*?)<\/description>/)?.[1];
    const leader = soapResponse.match(/<leader>(.*?)<\/leader>/)?.[1];
    const member_count = soapResponse.match(/<member_count>(\d+)<\/member_count>/)?.[1];

    if (!id) {
      return res.status(404).json({
        error: 'Guild not found',
        links: [
          { rel: 'all-guilds', href: '/api/gateway/guilds' }
        ]
      });
    }

    const guild = {
      id: parseInt(id),
      name,
      description,
      leader,
      member_count: parseInt(member_count || 0)
    };

    res.json({
      data: guild,
      source: 'SOAP Service',
      links: [
        { rel: 'self', href: `/api/gateway/guilds/${req.params.id}` },
        { rel: 'members', href: `/api/gateway/guilds/${req.params.id}/members` },
        { rel: 'join', href: '/api/gateway/guilds/join', method: 'POST' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch guild',
      details: error.message
    });
  }
});

// Criar nova guilda (SOAP)
app.post('/api/gateway/guilds', checkSoapConnection, async (req, res) => {
  try {
    const { name, description, leader } = req.body;
    
    if (!name || !description || !leader) {
      return res.status(400).json({
        error: 'Name, description and leader are required',
        links: [
          { rel: 'retry', href: '/api/gateway/guilds', method: 'POST' }
        ]
      });
    }

    const soapBody = `
      <name>${name}</name>
      <description>${description}</description>
      <leader>${leader}</leader>
    `;
    
    const soapResponse = await soapRequest('create_guild', soapBody);
    
    // Parse da resposta para extrair a guilda criada
    const id = soapResponse.match(/<id>(\d+)<\/id>/)?.[1];
    const guildName = soapResponse.match(/<name>(.*?)<\/name>/)?.[1];
    
    if (!id) {
      return res.status(400).json({
        error: 'Guild name already exists or creation failed'
      });
    }

    const guild = {
      id: parseInt(id),
      name: guildName,
      description,
      leader,
      member_count: 1
    };

    res.status(201).json({
      data: guild,
      source: 'SOAP Service',
      links: [
        { rel: 'self', href: `/api/gateway/guilds/${guild.id}` },
        { rel: 'members', href: `/api/gateway/guilds/${guild.id}/members` },
        { rel: 'all-guilds', href: '/api/gateway/guilds' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create guild',
      details: error.message
    });
  }
});

// Entrar em uma guilda (SOAP)
app.post('/api/gateway/guilds/join', checkSoapConnection, async (req, res) => {
  try {
    const { guild_id, character_name } = req.body;
    
    if (!guild_id || !character_name) {
      return res.status(400).json({
        error: 'guild_id and character_name are required'
      });
    }

    const soapBody = `
      <guild_id>${guild_id}</guild_id>
      <character_name>${character_name}</character_name>
    `;
    
    try {
      const soapResponse = await soapRequest('join_guild', soapBody);
      
      // Verifica se houve sucesso na resposta
      const message = soapResponse.includes('successfully') ? 
        `${character_name} joined guild successfully` :
        'Character joined guild';

      res.json({
        message,
        source: 'SOAP Service',
        links: [
          { rel: 'guild', href: `/api/gateway/guilds/${guild_id}` },
          { rel: 'members', href: `/api/gateway/guilds/${guild_id}/members` }
        ]
      });
    } catch (soapError) {
      // Tratar erros SOAP específicos
      if (soapError.message === 'Character already in guild') {
        return res.status(400).json({
          error: 'Character already in guild',
          message: `${character_name} já está nesta guilda`
        });
      } else if (soapError.message === 'Guild not found') {
        return res.status(404).json({
          error: 'Guild not found',
          message: 'Guilda não encontrada'
        });
      } else {
        throw soapError;
      }
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to join guild',
      details: error.message
    });
  }
});

// Membros da guilda (SOAP)
app.get('/api/gateway/guilds/:id/members', checkSoapConnection, async (req, res) => {
  try {
    const soapBody = `<guild_id>${req.params.id}</guild_id>`;
    const soapResponse = await soapRequest('get_guild_members', soapBody);
    
    // Parse da resposta para extrair membros
    const members = [];
    const memberMatches = soapResponse.match(/<member>[\s\S]*?<\/member>/g);
    
    if (memberMatches) {
      memberMatches.forEach(memberXml => {
        const id = memberXml.match(/<id>(\d+)<\/id>/)?.[1];
        const character_name = memberXml.match(/<character_name>(.*?)<\/character_name>/)?.[1];
        const rank = memberXml.match(/<rank>(.*?)<\/rank>/)?.[1];
        const join_date = memberXml.match(/<join_date>(.*?)<\/join_date>/)?.[1];
        
        if (id && character_name) {
          members.push({
            id: parseInt(id),
            character_name,
            rank,
            join_date
          });
        }
      });
    }

    res.json({
      data: members,
      source: 'SOAP Service',
      links: [
        { rel: 'self', href: `/api/gateway/guilds/${req.params.id}/members` },
        { rel: 'guild', href: `/api/gateway/guilds/${req.params.id}` },
        { rel: 'join', href: '/api/gateway/guilds/join', method: 'POST' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch guild members',
      details: error.message
    });
  }
});

// ============ ROTAS INTEGRADAS ============

// Dashboard - combina dados REST e SOAP
app.get('/api/gateway/dashboard', async (req, res) => {
  const dashboard = {
    timestamp: new Date().toISOString(),
    data: {},
    sources: []
  };

  try {
    // Busca personagens (REST)
    const charactersResponse = await axios.get(`${REST_API_URL}/api/characters`);
    dashboard.data.characters = {
      count: charactersResponse.data.length,
      list: charactersResponse.data.slice(0, 5) // Primeiros 5
    };
    dashboard.sources.push('REST API');
  } catch {
    dashboard.data.characters = { error: 'REST API unavailable' };
  }

  try {
    // Busca guildas (SOAP)
    const soapResponse = await soapRequest('get_all_guilds');
    const guilds = [];
    const guildMatches = soapResponse.match(/<guild>[\s\S]*?<\/guild>/g);
    
    if (guildMatches) {
      guildMatches.forEach(guildXml => {
        const id = guildXml.match(/<id>(\d+)<\/id>/)?.[1];
        const name = guildXml.match(/<name>(.*?)<\/name>/)?.[1];
        if (id && name) {
          guilds.push({ id: parseInt(id), name });
        }
      });
    }
    
    dashboard.data.guilds = {
      count: guilds.length,
      list: guilds.slice(0, 5)
    };
    dashboard.sources.push('SOAP Service');
  } catch {
    dashboard.data.guilds = { error: 'SOAP Service unavailable' };
  }

  res.json({
    ...dashboard,
    links: [
      { rel: 'self', href: '/api/gateway/dashboard' },
      { rel: 'characters', href: '/api/gateway/characters' },
      { rel: 'guilds', href: '/api/gateway/guilds' },
      { rel: 'health', href: '/api/gateway/health' }
    ]
  });
});

// Documentação Swagger
const swaggerDocument = require('./swagger-gateway.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Ashen Network API Gateway',
    description: 'Gateway que integra serviços REST e SOAP',
    version: '1.0.0',
    links: [
      { rel: 'health', href: '/api/gateway/health' },
      { rel: 'dashboard', href: '/api/gateway/dashboard' },
      { rel: 'characters', href: '/api/gateway/characters' },
      { rel: 'guilds', href: '/api/gateway/guilds' },
      { rel: 'documentation', href: '/api-docs' }
    ]
  });
});

// Inicialização
const PORT = 4000;

app.listen(PORT, () => {
  console.log('=== ASHEN NETWORK API GATEWAY ===');
  console.log(`🚀 Gateway rodando em http://localhost:${PORT}`);
  console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/gateway/health`);
  console.log('==================================');
});

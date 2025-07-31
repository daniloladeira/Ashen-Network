# Ashen Network - Arquitetura REST + SOAP

## 🎯 Visão Geral

O **Ashen Network** é um sistema completo que demonstra a integração entre arquiteturas REST e SOAP, implementando um API Gateway que centraliza o acesso a ambos os serviços. O projeto é baseado no universo de Dark Souls, gerenciando personagens, itens e guildas.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐
│   Cliente Web   │    │  Swagger UI     │
│   (HTML/JS)     │    │ (Documentação)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     API GATEWAY         │
                    │   (Node.js Express)     │
                    │     Port 4000           │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       HATEOAS           │
                    │  (Links Relacionais)    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌──▼──┐
    │    REST API       │ │  SOAP SERVICE     │ │ DB  │
    │  (Node.js)        │ │   (Python)        │ │     │
    │   Port 3001       │ │   Port 8000       │ │     │
    │                   │ │                   │ │     │
    │ • Characters      │ │ • Guilds          │ │     │
    │ • Items           │ │ • Members         │ │     │
    └───────────────────┘ └───────────────────┘ └─────┘
```

## 📋 Componentes Implementados

### ✅ 1. API Gateway
- **Tecnologia**: Node.js + Express
- **Porta**: 4000
- **Funcionalidades**:
  - Centraliza acesso aos serviços REST e SOAP
  - Implementa HATEOAS completo
  - Health check dos serviços
  - Dashboard integrado
  - Documentação Swagger

### ✅ 2. Serviço REST
- **Tecnologia**: Node.js + Express + SQLite
- **Porta**: 3001
- **Recursos**:
  - Personagens (CRUD)
  - Itens (CRUD)
  - Relacionamentos Character-Item
  - HATEOAS nos endpoints

### ✅ 3. Serviço SOAP
- **Tecnologia**: Python + Spyne + SQLite
- **Porta**: 8000
- **Recursos**:
  - Guildas (CRUD)
  - Membros de guilda
  - WSDL auto-gerado
  - Validação de dados

### ✅ 4. Cliente Web
- **Tecnologia**: React.js + CSS3 + Axios
- **Funcionalidades**:
  - Interface moderna e responsiva
  - Componentes reutilizáveis
  - Consome tanto REST quanto SOAP via Gateway
  - Status em tempo real dos serviços
  - Dashboard integrado

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- Python 3.8+
- npm ou yarn

### ⚠️ Ordem de Execução
Execute os serviços nesta ordem (cada um em um terminal separado):

### 1. REST API
```bash
cd Ashen-Network
npm install
npm run dev
# Servidor rodando em http://localhost:3001
# Swagger em http://localhost:3001/api-docs
```

### 2. Serviço SOAP
```bash
cd soap-server
pip install flask flask-cors
python soap_server_simple.py
# Servidor rodando em http://localhost:8000
# WSDL em http://localhost:8000/?wsdl
```

### 3. API Gateway
```bash
cd gateway
npm install
npm start
# Gateway rodando em http://localhost:4000
# Swagger em http://localhost:4000/api-docs
```

### 4. Cliente Web React
```bash
cd client-react
npm install
npm start
# Cliente rodando em http://localhost:3000
```

## 📝 WSDL - Principais Tags

O arquivo WSDL é gerado automaticamente pelo servidor SOAP Python. Principais tags:

```xml
<definitions xmlns:tns="http://ashennetwork.soap/guild">
  <!-- Define o namespace principal -->
  
  <types>
    <!-- Define tipos complexos: Guild, Member -->
    <xs:complexType name="Guild">
      <xs:element name="id" type="xs:int"/>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="description" type="xs:string"/>
      <xs:element name="leader" type="xs:string"/>
      <xs:element name="member_count" type="xs:int"/>
    </xs:complexType>
  </types>
  
  <message name="get_all_guilds">
    <!-- Mensagens de entrada/saída -->
  </message>
  
  <portType name="GuildService">
    <!-- Operações disponíveis -->
    <operation name="get_all_guilds"/>
    <operation name="create_guild"/>
    <operation name="join_guild"/>
  </portType>
  
  <binding name="GuildServiceSoap11Binding" type="tns:GuildService">
    <!-- Vinculação SOAP 1.1 -->
  </binding>
  
  <service name="Application">
    <port name="Application" binding="tns:GuildServiceSoap11Binding">
      <soap:address location="http://localhost:8000/"/>
    </port>
  </service>
</definitions>
```

## 🔗 HATEOAS Implementado

### No API Gateway:
```json
{
  "data": [...],
  "source": "REST API",
  "links": [
    { "rel": "self", "href": "/api/gateway/characters" },
    { "rel": "create", "href": "/api/gateway/characters", "method": "POST" },
    { "rel": "guilds", "href": "/api/gateway/guilds" }
  ]
}
```

### Na REST API:
```json
{
  "id": 1,
  "name": "Artorias",
  "level": 50,
  "links": [
    { "rel": "self", "href": "/api/characters/1" },
    { "rel": "items", "href": "/api/characters/1/items" },
    { "rel": "gateway", "href": "/api/gateway/characters/1" }
  ]
}
```

## 🧪 Testando o Sistema

### 1. Health Check
```bash
curl http://localhost:4000/api/gateway/health
```

### 2. Dashboard Integrado
```bash
curl http://localhost:4000/api/gateway/dashboard
```

### 3. Criar Personagem (REST via Gateway)
```bash
curl -X POST http://localhost:4000/api/gateway/characters \
  -H "Content-Type: application/json" \
  -d '{"name": "Chosen Undead", "level": 25}'
```

### 4. Criar Guilda (SOAP via Gateway)
```bash
curl -X POST http://localhost:4000/api/gateway/guilds \
  -H "Content-Type: application/json" \
  -d '{"name": "Warriors of Sunlight", "description": "Praise the Sun!", "leader": "Solaire"}'
```

### 5. WSDL do Serviço SOAP
```bash
curl http://localhost:8000/?wsdl
```

## 🌐 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API Gateway** | http://localhost:4000 | Ponto de entrada principal |
| **Gateway Docs** | http://localhost:4000/api-docs | Documentação Swagger |
| **Gateway Health** | http://localhost:4000/api/gateway/health | Status dos serviços |
| **REST API** | http://localhost:3001/api/characters | API de personagens |
| **REST Docs** | http://localhost:3001/api-docs | Documentação REST |
| **SOAP Service** | http://localhost:8000 | Serviço de guildas |
| **WSDL** | http://localhost:8000/?wsdl | Definição do serviço SOAP |
| **Cliente Web** | http://localhost:3000 | Interface React |

## 🏆 Diferenciais do Projeto

1. **Arquitetura Completa**: Integração real entre REST e SOAP
2. **Gateway Robusto**: Centralização com HATEOAS e health checks
3. **Múltiplas Linguagens**: Node.js e Python
4. **Documentação Completa**: Swagger para ambas as APIs
5. **Cliente Moderno**: Interface web responsiva
6. **WSDL Detalhado**: Documentação completa do serviço SOAP

## 📊 Métricas do Projeto

- **Linguagens**: 2 (JavaScript/Node.js, Python)
- **Protocolos**: 2 (REST, SOAP)
- **Bancos de Dados**: 2 (SQLite para cada serviço)
- **Clientes**: 1 (Web)
- **Documentação**: 2 (Swagger REST + SOAP, WSDL)
- **Endpoints**: 15+ (Gateway + REST + SOAP)

## 🎮 Contexto do Dark Souls

O sistema simula uma rede de jogadores de Dark Souls onde:
- **Personagens**: Heróis com níveis e equipamentos
- **Itens**: Armas, armaduras e consumíveis do jogo
- **Guildas**: Alianças como "Covenant of Artorias", "Lords of Cinder"
- **Membros**: Jogadores com diferentes ranks nas guildas

Esta temática torna o projeto mais interessante e contextualizado, facilitando a demonstração das funcionalidades.
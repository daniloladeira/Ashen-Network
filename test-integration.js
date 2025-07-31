const axios = require('axios');

// URLs dos serviços
const GATEWAY_URL = 'http://localhost:4000';
const REST_URL = 'http://localhost:3001';
const SOAP_URL = 'http://localhost:8000';

// Cores para output no console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
    console.log('\n' + '='.repeat(60));
    log(`🧪 ${title}`, 'bold');
    console.log('='.repeat(60));
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Função para esperar um tempo
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Testes das APIs
async function testHealthCheck() {
    header('TESTE 1: Health Check do Gateway');
    
    try {
        const response = await axios.get(`${GATEWAY_URL}/api/gateway/health`);
        const data = response.data;
        
        success('Gateway está rodando');
        info(`Status REST: ${data.services.rest}`);
        info(`Status SOAP: ${data.services.soap}`);
        
        if (data.services.rest === 'connected' && data.services.soap === 'connected') {
            success('Todos os serviços estão conectados!');
            return true;
        } else {
            warning('Alguns serviços não estão conectados');
            return false;
        }
    } catch (err) {
        error(`Gateway não está acessível: ${err.message}`);
        return false;
    }
}

async function testRESTAPI() {
    header('TESTE 2: API REST - Personagens');
    
    try {
        // Listar personagens existentes
        info('Listando personagens existentes...');
        const listResponse = await axios.get(`${GATEWAY_URL}/api/gateway/characters`);
        success(`Encontrados ${listResponse.data.data.length} personagens`);
        
        // Criar novo personagem
        info('Criando novo personagem...');
        const newCharacter = {
            name: 'Teste Hero',
            level: 42
        };
        
        const createResponse = await axios.post(`${GATEWAY_URL}/api/gateway/characters`, newCharacter);
        success(`Personagem criado: ${createResponse.data.data.name} (ID: ${createResponse.data.data.id})`);
        
        // Verificar HATEOAS
        if (createResponse.data.links && createResponse.data.links.length > 0) {
            success('HATEOAS implementado - Links encontrados');
            createResponse.data.links.forEach(link => {
                info(`  - ${link.rel}: ${link.href}`);
            });
        }
        
        return createResponse.data.data.id;
        
    } catch (err) {
        error(`Erro ao testar REST API: ${err.message}`);
        return null;
    }
}

async function testSOAPService() {
    header('TESTE 3: Serviço SOAP - Guildas');
    
    try {
        // Verificar WSDL
        info('Verificando WSDL...');
        const wsdlResponse = await axios.get(`${SOAP_URL}/?wsdl`);
        if (wsdlResponse.data.includes('<definitions')) {
            success('WSDL está disponível e válido');
            
            // Verificar principais tags do WSDL
            const wsdlContent = wsdlResponse.data;
            const tags = ['<types>', '<message>', '<portType>', '<binding>', '<service>'];
            tags.forEach(tag => {
                if (wsdlContent.includes(tag)) {
                    success(`Tag WSDL encontrada: ${tag}`);
                } else {
                    warning(`Tag WSDL não encontrada: ${tag}`);
                }
            });
        }
        
        // Listar guildas via Gateway
        info('Listando guildas via Gateway...');
        const guildsResponse = await axios.get(`${GATEWAY_URL}/api/gateway/guilds`);
        success(`Encontradas ${guildsResponse.data.data.length} guildas`);
        
        // Criar nova guilda
        info('Criando nova guilda...');
        const newGuild = {
            name: `Teste Guild ${Date.now()}`,
            description: 'Guilda criada durante teste automatizado',
            leader: 'Test Leader'
        };
        
        const createGuildResponse = await axios.post(`${GATEWAY_URL}/api/gateway/guilds`, newGuild);
        success(`Guilda criada: ${createGuildResponse.data.data.name}`);
        
        return createGuildResponse.data.data.id;
        
    } catch (err) {
        error(`Erro ao testar SOAP Service: ${err.message}`);
        return null;
    }
}

async function testIntegration(characterId, guildId) {
    header('TESTE 4: Integração REST + SOAP');
    
    if (!characterId || !guildId) {
        warning('IDs não disponíveis para teste de integração');
        return;
    }
    
    try {
        // Adicionar personagem à guilda
        info('Adicionando personagem à guilda...');
        const joinData = {
            guild_id: guildId,
            character_name: 'Teste Hero'
        };
        
        const joinResponse = await axios.post(`${GATEWAY_URL}/api/gateway/guilds/join`, joinData);
        success(`Resultado: ${joinResponse.data.message}`);
        
        // Verificar membros da guilda
        info('Verificando membros da guilda...');
        const membersResponse = await axios.get(`${GATEWAY_URL}/api/gateway/guilds/${guildId}/members`);
        success(`Guilda tem ${membersResponse.data.data.length} membros`);
        
        membersResponse.data.data.forEach(member => {
            info(`  - ${member.character_name} (${member.rank})`);
        });
        
    } catch (err) {
        error(`Erro no teste de integração: ${err.message}`);
    }
}

async function testDashboard() {
    header('TESTE 5: Dashboard Integrado');
    
    try {
        const dashboardResponse = await axios.get(`${GATEWAY_URL}/api/gateway/dashboard`);
        const data = dashboardResponse.data;
        
        success('Dashboard carregado com sucesso');
        info(`Fontes de dados: ${data.sources.join(', ')}`);
        
        if (data.data.characters) {
            info(`Personagens: ${data.data.characters.count || 'N/A'}`);
        }
        
        if (data.data.guilds) {
            info(`Guildas: ${data.data.guilds.count || 'N/A'}`);
        }
        
        // Verificar HATEOAS no dashboard
        if (data.links && data.links.length > 0) {
            success('Dashboard tem links HATEOAS');
        }
        
    } catch (err) {
        error(`Erro ao testar dashboard: ${err.message}`);
    }
}

async function testHATEOAS() {
    header('TESTE 6: Verificação HATEOAS');
    
    try {
        // Testar HATEOAS na raiz do gateway
        const rootResponse = await axios.get(`${GATEWAY_URL}/`);
        if (rootResponse.data.links) {
            success('HATEOAS na raiz do gateway');
            rootResponse.data.links.forEach(link => {
                info(`  - ${link.rel}: ${link.href}`);
            });
        }
        
        // Testar HATEOAS em personagens
        const charactersResponse = await axios.get(`${GATEWAY_URL}/api/gateway/characters`);
        if (charactersResponse.data.links) {
            success('HATEOAS em personagens');
        }
        
        // Testar HATEOAS em guildas
        const guildsResponse = await axios.get(`${GATEWAY_URL}/api/gateway/guilds`);
        if (guildsResponse.data.links) {
            success('HATEOAS em guildas');
        }
        
    } catch (err) {
        error(`Erro ao verificar HATEOAS: ${err.message}`);
    }
}

async function generateReport() {
    header('RELATÓRIO FINAL');
    
    try {
        // Estatísticas finais
        const dashboardResponse = await axios.get(`${GATEWAY_URL}/api/gateway/dashboard`);
        const healthResponse = await axios.get(`${GATEWAY_URL}/api/gateway/health`);
        
        const stats = dashboardResponse.data;
        const health = healthResponse.data;
        
        log('\n📊 ESTATÍSTICAS FINAIS:', 'cyan');
        log(`   • Gateway: ${health.gateway}`, 'cyan');
        log(`   • REST API: ${health.services.rest}`, 'cyan');
        log(`   • SOAP Service: ${health.services.soap}`, 'cyan');
        log(`   • Personagens: ${stats.data.characters?.count || 0}`, 'cyan');
        log(`   • Guildas: ${stats.data.guilds?.count || 0}`, 'cyan');
        log(`   • Fontes ativas: ${stats.sources?.length || 0}`, 'cyan');
        
        log('\n🔗 URLs TESTADAS:', 'magenta');
        log(`   • Gateway: ${GATEWAY_URL}`, 'magenta');
        log(`   • REST API: ${REST_URL}`, 'magenta');
        log(`   • SOAP Service: ${SOAP_URL}`, 'magenta');
        log(`   • WSDL: ${SOAP_URL}/?wsdl`, 'magenta');
        
    } catch (err) {
        warning('Não foi possível gerar relatório completo');
    }
}

// Função principal
async function runTests() {
    log('\n🔥 ASHEN NETWORK - TESTE AUTOMATIZADO', 'bold');
    log('🎯 Testando integração REST + SOAP + Gateway', 'cyan');
    
    let characterId = null;
    let guildId = null;
    
    // Aguardar serviços estarem prontos
    info('Aguardando serviços ficarem prontos...');
    await delay(2000);
    
    // 1. Health Check
    const healthOK = await testHealthCheck();
    if (!healthOK) {
        error('Testes interrompidos - serviços não estão prontos');
        return;
    }
    
    await delay(1000);
    
    // 2. Teste REST
    characterId = await testRESTAPI();
    await delay(1000);
    
    // 3. Teste SOAP
    guildId = await testSOAPService();
    await delay(1000);
    
    // 4. Teste Integração
    await testIntegration(characterId, guildId);
    await delay(1000);
    
    // 5. Teste Dashboard
    await testDashboard();
    await delay(1000);
    
    // 6. Teste HATEOAS
    await testHATEOAS();
    await delay(1000);
    
    // 7. Relatório Final
    await generateReport();
    
    header('TESTE CONCLUÍDO');
    success('Todos os testes foram executados!');
    info('Verifique os resultados acima para identificar possíveis problemas.');
}

// Verificar se é execução direta
if (require.main === module) {
    runTests().catch(err => {
        error(`Erro durante execução dos testes: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runTests };

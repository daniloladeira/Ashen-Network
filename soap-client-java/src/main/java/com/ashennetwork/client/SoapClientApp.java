package com.ashennetwork.client;

import javax.xml.namespace.QName;
import javax.xml.soap.*;
import javax.xml.ws.Dispatch;
import javax.xml.ws.Service;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Scanner;

/**
 * Cliente SOAP em Java para o serviço de Guildas do Ashen Network
 * 
 * Arquitetura utilizada:
 * - JAX-WS (Java API for XML Web Services) para comunicação SOAP
 * - SAAJ (SOAP with Attachments API for Java) para manipulação de mensagens SOAP
 * - Dispatch API para controle direto das mensagens SOAP
 * 
 * Como o cliente utiliza o WSDL:
 * 1. O WSDL é lido para descobrir os serviços disponíveis
 * 2. As operações e tipos de dados são identificados
 * 3. As mensagens SOAP são construídas baseadas no WSDL
 * 4. O endpoint do serviço é obtido do WSDL
 */
public class SoapClientApp {
    
    private static final String WSDL_URL = "http://localhost:8000/?wsdl";
    private static final String SERVICE_URL = "http://localhost:8000/";
    private static final String NAMESPACE_URI = "http://ashennetwork.soap/guild";
    
    private Service service;
    private Dispatch<SOAPMessage> dispatch;
    private MessageFactory messageFactory;
    
    public SoapClientApp() {
        try {
            // Inicializa o serviço usando informações do WSDL
            QName serviceName = new QName(NAMESPACE_URI, "Application");
            service = Service.create(new java.net.URL(WSDL_URL), serviceName);
            
            // Cria dispatcher para envio direto de mensagens SOAP
            QName portName = new QName(NAMESPACE_URI, "Application");
            dispatch = service.createDispatch(portName, SOAPMessage.class, Service.Mode.MESSAGE);
            
            // Factory para criar mensagens SOAP
            messageFactory = MessageFactory.newInstance();
            
            System.out.println("✅ Cliente SOAP conectado com sucesso!");
            System.out.println("📍 WSDL: " + WSDL_URL);
            System.out.println("🎯 Endpoint: " + SERVICE_URL);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao conectar com o serviço SOAP: " + e.getMessage());
            System.err.println("🔧 Certifique-se de que o servidor SOAP está rodando na porta 8000");
        }
    }
    
    /**
     * Lista todas as guildas disponíveis
     */
    public void listAllGuilds() {
        try {
            System.out.println("\n🏰 Listando todas as guildas...");
            
            // Cria mensagem SOAP baseada no WSDL
            SOAPMessage request = messageFactory.createMessage();
            SOAPBody body = request.getSOAPBody();
            
            // Adiciona elemento da operação conforme especificado no WSDL
            SOAPElement operation = body.addChildElement("get_all_guilds", "tns", NAMESPACE_URI);
            
            // Envia requisição e recebe resposta
            SOAPMessage response = dispatch.invoke(request);
            
            // Processa resposta
            processGuildsResponse(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao listar guildas: " + e.getMessage());
        }
    }
    
    /**
     * Busca uma guilda específica por ID
     */
    public void getGuildById(int guildId) {
        try {
            System.out.println("\n🔍 Buscando guilda ID: " + guildId);
            
            SOAPMessage request = messageFactory.createMessage();
            SOAPBody body = request.getSOAPBody();
            
            // Operação get_guild_by_id conforme WSDL
            SOAPElement operation = body.addChildElement("get_guild_by_id", "tns", NAMESPACE_URI);
            SOAPElement param = operation.addChildElement("guild_id", "tns", NAMESPACE_URI);
            param.addTextNode(String.valueOf(guildId));
            
            SOAPMessage response = dispatch.invoke(request);
            processGuildResponse(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao buscar guilda: " + e.getMessage());
        }
    }
    
    /**
     * Cria uma nova guilda
     */
    public void createGuild(String name, String description, String leader) {
        try {
            System.out.println("\n➕ Criando nova guilda: " + name);
            
            SOAPMessage request = messageFactory.createMessage();
            SOAPBody body = request.getSOAPBody();
            
            // Operação create_guild conforme WSDL
            SOAPElement operation = body.addChildElement("create_guild", "tns", NAMESPACE_URI);
            
            SOAPElement nameElement = operation.addChildElement("name", "tns", NAMESPACE_URI);
            nameElement.addTextNode(name);
            
            SOAPElement descElement = operation.addChildElement("description", "tns", NAMESPACE_URI);
            descElement.addTextNode(description);
            
            SOAPElement leaderElement = operation.addChildElement("leader", "tns", NAMESPACE_URI);
            leaderElement.addTextNode(leader);
            
            SOAPMessage response = dispatch.invoke(request);
            processGuildResponse(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao criar guilda: " + e.getMessage());
        }
    }
    
    /**
     * Adiciona um personagem a uma guilda
     */
    public void joinGuild(int guildId, String characterName) {
        try {
            System.out.println("\n🤝 " + characterName + " entrando na guilda ID: " + guildId);
            
            SOAPMessage request = messageFactory.createMessage();
            SOAPBody body = request.getSOAPBody();
            
            // Operação join_guild conforme WSDL
            SOAPElement operation = body.addChildElement("join_guild", "tns", NAMESPACE_URI);
            
            SOAPElement guildIdElement = operation.addChildElement("guild_id", "tns", NAMESPACE_URI);
            guildIdElement.addTextNode(String.valueOf(guildId));
            
            SOAPElement charElement = operation.addChildElement("character_name", "tns", NAMESPACE_URI);
            charElement.addTextNode(characterName);
            
            SOAPMessage response = dispatch.invoke(request);
            processJoinResponse(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao entrar na guilda: " + e.getMessage());
        }
    }
    
    /**
     * Lista membros de uma guilda
     */
    public void getGuildMembers(int guildId) {
        try {
            System.out.println("\n👥 Listando membros da guilda ID: " + guildId);
            
            SOAPMessage request = messageFactory.createMessage();
            SOAPBody body = request.getSOAPBody();
            
            // Operação get_guild_members conforme WSDL
            SOAPElement operation = body.addChildElement("get_guild_members", "tns", NAMESPACE_URI);
            SOAPElement param = operation.addChildElement("guild_id", "tns", NAMESPACE_URI);
            param.addTextNode(String.valueOf(guildId));
            
            SOAPMessage response = dispatch.invoke(request);
            processMembersResponse(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao listar membros: " + e.getMessage());
        }
    }
    
    // Métodos para processar respostas SOAP
    
    private void processGuildsResponse(SOAPMessage response) throws Exception {
        System.out.println("\n📋 Guildas encontradas:");
        System.out.println("─".repeat(50));
        
        // Extrai dados da resposta SOAP
        String responseContent = soapMessageToString(response);
        
        // Parse simples dos dados (em ambiente real, usaria um parser XML adequado)
        if (responseContent.contains("<name>")) {
            String[] guilds = responseContent.split("<name>");
            for (int i = 1; i < guilds.length; i++) {
                String guildData = guilds[i];
                String name = extractValue(guildData, "</name>");
                System.out.println("🏰 " + name);
            }
        } else {
            System.out.println("Nenhuma guilda encontrada ou erro na resposta.");
        }
        
        System.out.println("─".repeat(50));
    }
    
    private void processGuildResponse(SOAPMessage response) throws Exception {
        String responseContent = soapMessageToString(response);
        
        if (responseContent.contains("<name>")) {
            String name = extractValueBetween(responseContent, "<name>", "</name>");
            String description = extractValueBetween(responseContent, "<description>", "</description>");
            String leader = extractValueBetween(responseContent, "<leader>", "</leader>");
            String memberCount = extractValueBetween(responseContent, "<member_count>", "</member_count>");
            
            System.out.println("\n📋 Detalhes da Guilda:");
            System.out.println("─".repeat(30));
            System.out.println("🏰 Nome: " + name);
            System.out.println("📝 Descrição: " + description);
            System.out.println("👑 Líder: " + leader);
            System.out.println("👥 Membros: " + memberCount);
            System.out.println("─".repeat(30));
        } else {
            System.out.println("❌ Guilda não encontrada ou erro na resposta.");
        }
    }
    
    private void processJoinResponse(SOAPMessage response) throws Exception {
        String responseContent = soapMessageToString(response);
        System.out.println("📨 Resposta: " + responseContent);
    }
    
    private void processMembersResponse(SOAPMessage response) throws Exception {
        String responseContent = soapMessageToString(response);
        
        System.out.println("\n👥 Membros da Guilda:");
        System.out.println("─".repeat(40));
        
        if (responseContent.contains("<character_name>")) {
            String[] members = responseContent.split("<character_name>");
            for (int i = 1; i < members.length; i++) {
                String memberData = members[i];
                String name = extractValue(memberData, "</character_name>");
                String rank = extractValueBetween(memberData, "<rank>", "</rank>");
                String joinDate = extractValueBetween(memberData, "<join_date>", "</join_date>");
                
                System.out.println("⚔️  " + name + " (" + rank + ") - Desde: " + joinDate);
            }
        } else {
            System.out.println("Nenhum membro encontrado ou erro na resposta.");
        }
        
        System.out.println("─".repeat(40));
    }
    
    // Métodos utilitários
    
    private String soapMessageToString(SOAPMessage message) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        message.writeTo(out);
        return out.toString();
    }
    
    private String extractValue(String text, String endTag) {
        int endIndex = text.indexOf(endTag);
        return endIndex > 0 ? text.substring(0, endIndex) : "";
    }
    
    private String extractValueBetween(String text, String startTag, String endTag) {
        int startIndex = text.indexOf(startTag);
        int endIndex = text.indexOf(endTag);
        
        if (startIndex >= 0 && endIndex > startIndex) {
            return text.substring(startIndex + startTag.length(), endIndex);
        }
        return "";
    }
    
    /**
     * Menu interativo para demonstrar as funcionalidades
     */
    public void runInteractiveMenu() {
        Scanner scanner = new Scanner(System.in);
        
        while (true) {
            System.out.println("\n" + "=".repeat(50));
            System.out.println("🔥 ASHEN NETWORK - CLIENTE SOAP JAVA");
            System.out.println("=".repeat(50));
            System.out.println("1. Listar todas as guildas");
            System.out.println("2. Buscar guilda por ID");
            System.out.println("3. Criar nova guilda");
            System.out.println("4. Entrar em uma guilda");
            System.out.println("5. Listar membros de uma guilda");
            System.out.println("6. Mostrar informações do WSDL");
            System.out.println("0. Sair");
            System.out.println("=".repeat(50));
            System.out.print("Escolha uma opção: ");
            
            try {
                int choice = scanner.nextInt();
                scanner.nextLine(); // Consume newline
                
                switch (choice) {
                    case 1:
                        listAllGuilds();
                        break;
                        
                    case 2:
                        System.out.print("Digite o ID da guilda: ");
                        int guildId = scanner.nextInt();
                        getGuildById(guildId);
                        break;
                        
                    case 3:
                        System.out.print("Nome da guilda: ");
                        String name = scanner.nextLine();
                        System.out.print("Descrição: ");
                        String description = scanner.nextLine();
                        System.out.print("Nome do líder: ");
                        String leader = scanner.nextLine();
                        createGuild(name, description, leader);
                        break;
                        
                    case 4:
                        System.out.print("ID da guilda: ");
                        int joinGuildId = scanner.nextInt();
                        scanner.nextLine();
                        System.out.print("Nome do personagem: ");
                        String characterName = scanner.nextLine();
                        joinGuild(joinGuildId, characterName);
                        break;
                        
                    case 5:
                        System.out.print("ID da guilda: ");
                        int membersGuildId = scanner.nextInt();
                        getGuildMembers(membersGuildId);
                        break;
                        
                    case 6:
                        showWSDLInfo();
                        break;
                        
                    case 0:
                        System.out.println("👋 Encerrando cliente SOAP...");
                        scanner.close();
                        return;
                        
                    default:
                        System.out.println("❌ Opção inválida!");
                }
                
                System.out.println("\nPressione Enter para continuar...");
                scanner.nextLine();
                
            } catch (Exception e) {
                System.err.println("❌ Erro: " + e.getMessage());
                scanner.nextLine(); // Clear invalid input
            }
        }
    }
    
    /**
     * Mostra informações sobre como o WSDL é utilizado
     */
    private void showWSDLInfo() {
        System.out.println("\n📋 INFORMAÇÕES DO WSDL");
        System.out.println("=".repeat(50));
        System.out.println("🌐 URL do WSDL: " + WSDL_URL);
        System.out.println("🎯 Namespace: " + NAMESPACE_URI);
        System.out.println("🔗 Endpoint: " + SERVICE_URL);
        
        System.out.println("\n📝 PRINCIPAIS TAGS DO WSDL:");
        System.out.println("• <definitions>: Define o namespace e elementos principais");
        System.out.println("• <types>: Define os tipos de dados (Guild, Member)");
        System.out.println("• <message>: Define as mensagens de entrada e saída");
        System.out.println("• <portType>: Define as operações disponíveis");
        System.out.println("• <binding>: Define como as operações são vinculadas ao SOAP");
        System.out.println("• <service>: Define o endpoint do serviço");
        
        System.out.println("\n🔧 COMO O CLIENTE USA O WSDL:");
        System.out.println("1. Lê o WSDL para descobrir operações disponíveis");
        System.out.println("2. Identifica os tipos de dados e estruturas");
        System.out.println("3. Constrói mensagens SOAP baseadas nas definições");
        System.out.println("4. Utiliza o endpoint definido no WSDL");
        System.out.println("5. Processa respostas conforme os tipos definidos");
        
        System.out.println("\n⚙️ OPERAÇÕES DISPONÍVEIS:");
        System.out.println("• get_all_guilds() - Lista todas as guildas");
        System.out.println("• get_guild_by_id(id) - Busca guilda por ID");
        System.out.println("• create_guild(name, desc, leader) - Cria guilda");
        System.out.println("• join_guild(guild_id, char_name) - Entra em guilda");
        System.out.println("• get_guild_members(guild_id) - Lista membros");
    }
    
    /**
     * Método principal
     */
    public static void main(String[] args) {
        System.out.println("🚀 Iniciando Cliente SOAP Java...");
        System.out.println("📋 Arquitetura: JAX-WS + SAAJ + Dispatch API");
        
        SoapClientApp client = new SoapClientApp();
        
        if (args.length > 0 && args[0].equals("demo")) {
            // Execução automática para demonstração
            System.out.println("\n🎮 DEMONSTRAÇÃO AUTOMÁTICA");
            client.listAllGuilds();
            client.getGuildById(1);
            client.getGuildMembers(1);
        } else {
            // Menu interativo
            client.runInteractiveMenu();
        }
    }
}

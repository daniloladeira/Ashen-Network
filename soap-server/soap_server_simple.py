from flask import Flask, request, Response, render_template_string
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Inicializar banco de dados
def init_database():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'guilds.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Criar tabela de guildas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS guilds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            leader TEXT NOT NULL,
            member_count INTEGER DEFAULT 1
        )
    ''')
    
    # Criar tabela de membros
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS guild_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_name TEXT NOT NULL,
            guild_id INTEGER,
            rank TEXT DEFAULT 'Member',
            join_date TEXT,
            FOREIGN KEY (guild_id) REFERENCES guilds (id)
        )
    ''')
    
    # Não inserir dados de exemplo - deixar banco vazio para testes
    # cursor.execute('SELECT COUNT(*) FROM guilds')
    # if cursor.fetchone()[0] == 0:
    #     # Dados de exemplo comentados
    #     pass
    
    conn.commit()
    conn.close()

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'guilds.db')
    return sqlite3.connect(db_path)

# WSDL Simplificado
WSDL_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:tns="http://ashennetwork.soap/guild"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="http://ashennetwork.soap/guild">

    <types>
        <xsd:schema targetNamespace="http://ashennetwork.soap/guild">
            <xsd:element name="get_all_guilds"/>
            <xsd:element name="get_guild_by_id">
                <xsd:complexType><xsd:sequence>
                    <xsd:element name="guild_id" type="xsd:int"/>
                </xsd:sequence></xsd:complexType>
            </xsd:element>
            <xsd:element name="create_guild">
                <xsd:complexType><xsd:sequence>
                    <xsd:element name="name" type="xsd:string"/>
                    <xsd:element name="description" type="xsd:string"/>
                    <xsd:element name="leader" type="xsd:string"/>
                </xsd:sequence></xsd:complexType>
            </xsd:element>
            <xsd:element name="join_guild">
                <xsd:complexType><xsd:sequence>
                    <xsd:element name="guild_id" type="xsd:int"/>
                    <xsd:element name="character_name" type="xsd:string"/>
                </xsd:sequence></xsd:complexType>
            </xsd:element>
            <xsd:element name="get_guild_members">
                <xsd:complexType><xsd:sequence>
                    <xsd:element name="guild_id" type="xsd:int"/>
                </xsd:sequence></xsd:complexType>
            </xsd:element>
        </xsd:schema>
    </types>

    <message name="GuildRequest"><part name="body" element="tns:get_all_guilds"/></message>
    <message name="GuildByIdRequest"><part name="body" element="tns:get_guild_by_id"/></message>
    <message name="CreateGuildRequest"><part name="body" element="tns:create_guild"/></message>
    <message name="JoinGuildRequest"><part name="body" element="tns:join_guild"/></message>
    <message name="MembersRequest"><part name="body" element="tns:get_guild_members"/></message>
    <message name="GuildResponse"><part name="body" type="xsd:string"/></message>

    <portType name="GuildService">
        <operation name="get_all_guilds">
            <input message="tns:GuildRequest"/>
            <output message="tns:GuildResponse"/>
        </operation>
        <operation name="get_guild_by_id">
            <input message="tns:GuildByIdRequest"/>
            <output message="tns:GuildResponse"/>
        </operation>
        <operation name="create_guild">
            <input message="tns:CreateGuildRequest"/>
            <output message="tns:GuildResponse"/>
        </operation>
        <operation name="join_guild">
            <input message="tns:JoinGuildRequest"/>
            <output message="tns:GuildResponse"/>
        </operation>
        <operation name="get_guild_members">
            <input message="tns:MembersRequest"/>
            <output message="tns:GuildResponse"/>
        </operation>
    </portType>

    <binding name="GuildServiceBinding" type="tns:GuildService">
        <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
        <operation name="get_all_guilds">
            <soap:operation soapAction="get_all_guilds"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="get_guild_by_id">
            <soap:operation soapAction="get_guild_by_id"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="create_guild">
            <soap:operation soapAction="create_guild"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="join_guild">
            <soap:operation soapAction="join_guild"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="get_guild_members">
            <soap:operation soapAction="get_guild_members"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
    </binding>

    <service name="GuildService">
        <port name="GuildServicePort" binding="tns:GuildServiceBinding">
            <soap:address location="http://localhost:8000/soap"/>
        </port>
    </service>
</definitions>'''

@app.route('/', methods=['GET'])
def wsdl():
    """Retorna o WSDL"""
    return Response(WSDL_TEMPLATE, mimetype='text/xml')

@app.route('/soap', methods=['POST'])
def soap_service():
    """Processa requisições SOAP"""
    try:
        soap_request = request.data.decode('utf-8')
        
        # Parse simples do SOAP (para demonstração)
        if 'get_all_guilds' in soap_request:
            return handle_get_all_guilds()
        elif 'get_guild_by_id' in soap_request:
            return handle_get_guild_by_id(soap_request)
        elif 'create_guild' in soap_request:
            return handle_create_guild(soap_request)
        elif 'join_guild' in soap_request:
            return handle_join_guild(soap_request)
        elif 'get_guild_members' in soap_request:
            return handle_get_guild_members(soap_request)
        else:
            return soap_fault("Unknown operation")
            
    except Exception as e:
        return soap_fault(str(e))

# Funções auxiliares para parsing SOAP
import re

def extract_soap_value(xml, tag):
    """Extrai valor de uma tag XML de forma simples"""
    pattern = f'<{tag}>(.*?)</{tag}>'
    match = re.search(pattern, xml)
    return match.group(1) if match else None

def create_soap_response(operation, content):
    """Cria resposta SOAP padronizada"""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:{operation}Response>
            {content}
        </tns:{operation}Response>
    </soap:Body>
</soap:Envelope>'''

def handle_get_all_guilds():
    """Lista todas as guildas"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, description, leader, member_count FROM guilds')
    guilds = cursor.fetchall()
    conn.close()
    
    guilds_xml = ""
    for guild in guilds:
        guilds_xml += f'''
            <guild>
                <id>{guild[0]}</id>
                <name>{guild[1]}</name>
                <description>{guild[2]}</description>
                <leader>{guild[3]}</leader>
                <member_count>{guild[4]}</member_count>
            </guild>'''
    
    return Response(create_soap_response('get_all_guilds', guilds_xml), mimetype='text/xml')

def handle_get_guild_by_id(soap_request):
    """Busca guilda por ID"""
    guild_id = extract_soap_value(soap_request, 'guild_id')
    if not guild_id:
        return soap_fault("Invalid guild_id")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, description, leader, member_count FROM guilds WHERE id = ?', (guild_id,))
    guild = cursor.fetchone()
    conn.close()
    
    if not guild:
        return soap_fault("Guild not found")
    
    guild_xml = f'''
        <guild>
            <id>{guild[0]}</id>
            <name>{guild[1]}</name>
            <description>{guild[2]}</description>
            <leader>{guild[3]}</leader>
            <member_count>{guild[4]}</member_count>
        </guild>'''
    
    return Response(create_soap_response('get_guild_by_id', guild_xml), mimetype='text/xml')

def handle_create_guild(soap_request):
    """Cria nova guilda"""
    name = extract_soap_value(soap_request, 'name')
    description = extract_soap_value(soap_request, 'description') 
    leader = extract_soap_value(soap_request, 'leader')
    
    if not all([name, description, leader]):
        return soap_fault("Missing required fields")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO guilds (name, description, leader, member_count) VALUES (?, ?, ?, 1)', 
                      (name, description, leader))
        guild_id = cursor.lastrowid
        
        # Adiciona o líder como membro
        cursor.execute('INSERT INTO guild_members (character_name, guild_id, rank, join_date) VALUES (?, ?, ?, ?)', 
                      (leader, guild_id, 'Leader', datetime.now().strftime('%Y-%m-%d')))
        
        conn.commit()
        conn.close()
        
        guild_xml = f'''
            <guild>
                <id>{guild_id}</id>
                <name>{name}</name>
                <description>{description}</description>
                <leader>{leader}</leader>
                <member_count>1</member_count>
            </guild>'''
        
        return Response(create_soap_response('create_guild', guild_xml), mimetype='text/xml')
        
    except sqlite3.IntegrityError:
        conn.close()
        return soap_fault("Guild name already exists")

def handle_join_guild(soap_request):
    """Adiciona personagem à guilda"""
    guild_id = extract_soap_value(soap_request, 'guild_id')
    character_name = extract_soap_value(soap_request, 'character_name')
    
    if not all([guild_id, character_name]):
        return soap_fault("Missing required fields")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verifica se a guilda existe
    cursor.execute('SELECT id FROM guilds WHERE id = ?', (guild_id,))
    if not cursor.fetchone():
        conn.close()
        return soap_fault("Guild not found")
    
    # Verifica se o personagem já está na guilda
    cursor.execute('SELECT id FROM guild_members WHERE character_name = ? AND guild_id = ?', (character_name, guild_id))
    if cursor.fetchone():
        conn.close()
        return soap_fault("Character already in guild")
    
    # Adiciona o membro
    cursor.execute('INSERT INTO guild_members (character_name, guild_id, rank, join_date) VALUES (?, ?, ?, ?)', 
                  (character_name, guild_id, 'Member', datetime.now().strftime('%Y-%m-%d')))
    
    # Atualiza o contador de membros
    cursor.execute('UPDATE guilds SET member_count = member_count + 1 WHERE id = ?', (guild_id,))
    
    conn.commit()
    conn.close()
    
    message_xml = f'<message>Character {character_name} joined guild successfully</message>'
    return Response(create_soap_response('join_guild', message_xml), mimetype='text/xml')

def handle_get_guild_members(soap_request):
    """Lista membros da guilda"""
    guild_id = extract_soap_value(soap_request, 'guild_id')
    if not guild_id:
        return soap_fault("Invalid guild_id")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, character_name, guild_id, rank, join_date FROM guild_members WHERE guild_id = ?', (guild_id,))
    members = cursor.fetchall()
    conn.close()
    
    members_xml = ""
    for member in members:
        members_xml += f'''
            <member>
                <id>{member[0]}</id>
                <character_name>{member[1]}</character_name>
                <guild_id>{member[2]}</guild_id>
                <rank>{member[3]}</rank>
                <join_date>{member[4]}</join_date>
            </member>'''
    
    return Response(create_soap_response('get_guild_members', members_xml), mimetype='text/xml')

def soap_fault(message):
    """Retorna um SOAP Fault"""
    fault = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>Server</faultcode>
            <faultstring>{message}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>'''
    
    return Response(fault, mimetype='text/xml', status=500)

# Página de informações
@app.route('/info')
def info():
    return '''
    <h1>🏰 Ashen Network SOAP Service</h1>
    <h2>🔗 Endpoints:</h2>
    <ul>
        <li><a href="/">WSDL</a> - Definição do serviço</li>
        <li><a href="/soap">SOAP Endpoint</a> - Operações SOAP</li>
        <li><a href="/info">Esta página</a> - Informações</li>
    </ul>
    <h2>🏰 Operações Disponíveis:</h2>
    <ul>
        <li>get_all_guilds - Lista todas as guildas</li>
        <li>get_guild_by_id - Busca guilda por ID</li>
        <li>create_guild - Cria nova guilda</li>
        <li>join_guild - Adiciona personagem à guilda</li>
        <li>get_guild_members - Lista membros da guilda</li>
    </ul>
    '''

if __name__ == '__main__':
    print("=== Ashen Network SOAP Server (Flask) ===")
    print("Servidor SOAP de Guildas do Dark Souls")
    print("WSDL disponível em: http://localhost:8000/")
    print("SOAP Endpoint: http://localhost:8000/soap")
    print("Info: http://localhost:8000/info")
    print("Porta: 8000")
    print("==========================================")
    
    # Inicializa o banco antes de iniciar o servidor
    init_database()
    
    app.run(host='localhost', port=8000, debug=True)

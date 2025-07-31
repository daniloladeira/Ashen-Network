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
    
    # Inserir dados de exemplo se não existirem
    cursor.execute('SELECT COUNT(*) FROM guilds')
    if cursor.fetchone()[0] == 0:
        sample_guilds = [
            ('Covenant of Artorias', 'Protectors of the realm against the Abyss', 'Knight Artorias', 5),
            ('Lords of Cinder', 'United to link the First Flame', 'Gwyn', 4),
            ('Dragon Slayers', 'Hunters of ancient dragons', 'Ornstein', 3)
        ]
        
        cursor.executemany('INSERT INTO guilds (name, description, leader, member_count) VALUES (?, ?, ?, ?)', sample_guilds)
        
        sample_members = [
            ('Artorias', 1, 'Leader', '2024-01-01'),
            ('Sif', 1, 'Guardian', '2024-01-02'),
            ('Ciaran', 1, 'Assassin', '2024-01-03'),
            ('Gough', 1, 'Archer', '2024-01-04'),
            ('Solaire', 1, 'Knight', '2024-01-05'),
            
            ('Gwyn', 2, 'Leader', '2024-01-01'),
            ('Ornstein', 2, 'Captain', '2024-01-02'),
            ('Smough', 2, 'Executioner', '2024-01-03'),
            ('Gwyndolin', 2, 'Sorcerer', '2024-01-04'),
            
            ('Ornstein', 3, 'Leader', '2024-01-01'),
            ('Dragonslayer Armour', 3, 'Elite', '2024-01-02'),
            ('Kalameet Hunter', 3, 'Veteran', '2024-01-03')
        ]
        
        cursor.executemany('INSERT INTO guild_members (character_name, guild_id, rank, join_date) VALUES (?, ?, ?, ?)', sample_members)
    
    conn.commit()
    conn.close()

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'guilds.db')
    return sqlite3.connect(db_path)

# WSDL Template
WSDL_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:tns="http://ashennetwork.soap/guild"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="http://ashennetwork.soap/guild"
             elementFormDefault="qualified">

    <!-- Types -->
    <types>
        <xsd:schema targetNamespace="http://ashennetwork.soap/guild">
            <!-- Guild Complex Type -->
            <xsd:complexType name="Guild">
                <xsd:sequence>
                    <xsd:element name="id" type="xsd:int"/>
                    <xsd:element name="name" type="xsd:string"/>
                    <xsd:element name="description" type="xsd:string"/>
                    <xsd:element name="leader" type="xsd:string"/>
                    <xsd:element name="member_count" type="xsd:int"/>
                </xsd:sequence>
            </xsd:complexType>
            
            <!-- Member Complex Type -->
            <xsd:complexType name="Member">
                <xsd:sequence>
                    <xsd:element name="id" type="xsd:int"/>
                    <xsd:element name="character_name" type="xsd:string"/>
                    <xsd:element name="guild_id" type="xsd:int"/>
                    <xsd:element name="rank" type="xsd:string"/>
                    <xsd:element name="join_date" type="xsd:string"/>
                </xsd:sequence>
            </xsd:complexType>
            
            <!-- Request/Response Elements -->
            <xsd:element name="get_all_guilds">
                <xsd:complexType/>
            </xsd:element>
            <xsd:element name="get_all_guildsResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild" type="tns:Guild" minOccurs="0" maxOccurs="unbounded"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            
            <xsd:element name="get_guild_by_id">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild_id" type="xsd:int"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="get_guild_by_idResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild" type="tns:Guild"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            
            <xsd:element name="create_guild">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="name" type="xsd:string"/>
                        <xsd:element name="description" type="xsd:string"/>
                        <xsd:element name="leader" type="xsd:string"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="create_guildResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild" type="tns:Guild"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            
            <xsd:element name="join_guild">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild_id" type="xsd:int"/>
                        <xsd:element name="character_name" type="xsd:string"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="join_guildResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="message" type="xsd:string"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            
            <xsd:element name="get_guild_members">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="guild_id" type="xsd:int"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="get_guild_membersResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="member" type="tns:Member" minOccurs="0" maxOccurs="unbounded"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
        </xsd:schema>
    </types>

    <!-- Messages -->
    <message name="get_all_guildsRequest">
        <part name="parameters" element="tns:get_all_guilds"/>
    </message>
    <message name="get_all_guildsResponse">
        <part name="parameters" element="tns:get_all_guildsResponse"/>
    </message>
    
    <message name="get_guild_by_idRequest">
        <part name="parameters" element="tns:get_guild_by_id"/>
    </message>
    <message name="get_guild_by_idResponse">
        <part name="parameters" element="tns:get_guild_by_idResponse"/>
    </message>
    
    <message name="create_guildRequest">
        <part name="parameters" element="tns:create_guild"/>
    </message>
    <message name="create_guildResponse">
        <part name="parameters" element="tns:create_guildResponse"/>
    </message>
    
    <message name="join_guildRequest">
        <part name="parameters" element="tns:join_guild"/>
    </message>
    <message name="join_guildResponse">
        <part name="parameters" element="tns:join_guildResponse"/>
    </message>
    
    <message name="get_guild_membersRequest">
        <part name="parameters" element="tns:get_guild_members"/>
    </message>
    <message name="get_guild_membersResponse">
        <part name="parameters" element="tns:get_guild_membersResponse"/>
    </message>

    <!-- Port Type -->
    <portType name="GuildServicePortType">
        <operation name="get_all_guilds">
            <input message="tns:get_all_guildsRequest"/>
            <output message="tns:get_all_guildsResponse"/>
        </operation>
        <operation name="get_guild_by_id">
            <input message="tns:get_guild_by_idRequest"/>
            <output message="tns:get_guild_by_idResponse"/>
        </operation>
        <operation name="create_guild">
            <input message="tns:create_guildRequest"/>
            <output message="tns:create_guildResponse"/>
        </operation>
        <operation name="join_guild">
            <input message="tns:join_guildRequest"/>
            <output message="tns:join_guildResponse"/>
        </operation>
        <operation name="get_guild_members">
            <input message="tns:get_guild_membersRequest"/>
            <output message="tns:get_guild_membersResponse"/>
        </operation>
    </portType>

    <!-- Binding -->
    <binding name="GuildServiceSoapBinding" type="tns:GuildServicePortType">
        <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
        
        <operation name="get_all_guilds">
            <soap:operation soapAction="http://ashennetwork.soap/guild/get_all_guilds"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        
        <operation name="get_guild_by_id">
            <soap:operation soapAction="http://ashennetwork.soap/guild/get_guild_by_id"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        
        <operation name="create_guild">
            <soap:operation soapAction="http://ashennetwork.soap/guild/create_guild"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        
        <operation name="join_guild">
            <soap:operation soapAction="http://ashennetwork.soap/guild/join_guild"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        
        <operation name="get_guild_members">
            <soap:operation soapAction="http://ashennetwork.soap/guild/get_guild_members"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
    </binding>

    <!-- Service -->
    <service name="GuildService">
        <port name="GuildServicePort" binding="tns:GuildServiceSoapBinding">
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
    
    response = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:get_all_guildsResponse>
            {guilds_xml}
        </tns:get_all_guildsResponse>
    </soap:Body>
</soap:Envelope>'''
    
    return Response(response, mimetype='text/xml')

def handle_get_guild_by_id(soap_request):
    """Busca guilda por ID"""
    # Extrair ID da requisição SOAP (parse simples)
    import re
    match = re.search(r'<guild_id>(\d+)</guild_id>', soap_request)
    if not match:
        return soap_fault("Invalid guild_id")
    
    guild_id = int(match.group(1))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, description, leader, member_count FROM guilds WHERE id = ?', (guild_id,))
    guild = cursor.fetchone()
    conn.close()
    
    if not guild:
        return soap_fault("Guild not found")
    
    response = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:get_guild_by_idResponse>
            <guild>
                <id>{guild[0]}</id>
                <name>{guild[1]}</name>
                <description>{guild[2]}</description>
                <leader>{guild[3]}</leader>
                <member_count>{guild[4]}</member_count>
            </guild>
        </tns:get_guild_by_idResponse>
    </soap:Body>
</soap:Envelope>'''
    
    return Response(response, mimetype='text/xml')

def handle_create_guild(soap_request):
    """Cria nova guilda"""
    import re
    
    name_match = re.search(r'<name>(.*?)</name>', soap_request)
    desc_match = re.search(r'<description>(.*?)</description>', soap_request)
    leader_match = re.search(r'<leader>(.*?)</leader>', soap_request)
    
    if not all([name_match, desc_match, leader_match]):
        return soap_fault("Missing required fields")
    
    name = name_match.group(1)
    description = desc_match.group(1)
    leader = leader_match.group(1)
    
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
        
        response = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:create_guildResponse>
            <guild>
                <id>{guild_id}</id>
                <name>{name}</name>
                <description>{description}</description>
                <leader>{leader}</leader>
                <member_count>1</member_count>
            </guild>
        </tns:create_guildResponse>
    </soap:Body>
</soap:Envelope>'''
        
        return Response(response, mimetype='text/xml')
        
    except sqlite3.IntegrityError:
        conn.close()
        return soap_fault("Guild name already exists")

def handle_join_guild(soap_request):
    """Adiciona personagem à guilda"""
    import re
    
    guild_id_match = re.search(r'<guild_id>(\d+)</guild_id>', soap_request)
    char_name_match = re.search(r'<character_name>(.*?)</character_name>', soap_request)
    
    if not all([guild_id_match, char_name_match]):
        return soap_fault("Missing required fields")
    
    guild_id = int(guild_id_match.group(1))
    character_name = char_name_match.group(1)
    
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
    
    response = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:join_guildResponse>
            <message>Character {character_name} joined guild successfully</message>
        </tns:join_guildResponse>
    </soap:Body>
</soap:Envelope>'''
    
    return Response(response, mimetype='text/xml')

def handle_get_guild_members(soap_request):
    """Lista membros da guilda"""
    import re
    
    guild_id_match = re.search(r'<guild_id>(\d+)</guild_id>', soap_request)
    if not guild_id_match:
        return soap_fault("Invalid guild_id")
    
    guild_id = int(guild_id_match.group(1))
    
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
    
    response = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://ashennetwork.soap/guild">
    <soap:Body>
        <tns:get_guild_membersResponse>
            {members_xml}
        </tns:get_guild_membersResponse>
    </soap:Body>
</soap:Envelope>'''
    
    return Response(response, mimetype='text/xml')

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

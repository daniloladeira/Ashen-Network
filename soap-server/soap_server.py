from spyne import Application, rpc, ServiceBase, Iterable, Integer, Unicode, ComplexModel
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from werkzeug.serving import run_simple
import sqlite3
import os

# Modelo para Guild (Guilda)
class Guild(ComplexModel):
    id = Integer
    name = Unicode
    description = Unicode
    leader = Unicode
    member_count = Integer

# Modelo para Member (Membro da Guilda)
class Member(ComplexModel):
    id = Integer
    character_name = Unicode
    guild_id = Integer
    rank = Unicode
    join_date = Unicode

class GuildService(ServiceBase):
    
    def __init__(self):
        super().__init__()
        self.init_database()
    
    def init_database(self):
        """Inicializa o banco de dados das guildas"""
        # Conecta ao banco principal ou cria um novo para as guildas
        db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'guilds.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Cria tabela de guildas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS guilds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                leader TEXT NOT NULL,
                member_count INTEGER DEFAULT 1
            )
        ''')
        
        # Cria tabela de membros
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
        
        # Insere dados de exemplo se não existirem
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
    
    def get_db_connection(self):
        """Retorna conexão com o banco de dados"""
        db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'guilds.db')
        return sqlite3.connect(db_path)

    @rpc(_returns=Iterable(Guild))
    def get_all_guilds(ctx):
        """Retorna todas as guildas"""
        conn = ctx.descriptor.service_class.get_db_connection(ctx.descriptor.service_class)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, name, description, leader, member_count FROM guilds')
        guilds = []
        
        for row in cursor.fetchall():
            guild = Guild()
            guild.id = row[0]
            guild.name = row[1]
            guild.description = row[2]
            guild.leader = row[3]
            guild.member_count = row[4]
            guilds.append(guild)
        
        conn.close()
        return guilds

    @rpc(Integer, _returns=Guild)
    def get_guild_by_id(ctx, guild_id):
        """Retorna uma guilda específica pelo ID"""
        conn = ctx.descriptor.service_class.get_db_connection(ctx.descriptor.service_class)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, name, description, leader, member_count FROM guilds WHERE id = ?', (guild_id,))
        row = cursor.fetchone()
        
        if row:
            guild = Guild()
            guild.id = row[0]
            guild.name = row[1]
            guild.description = row[2]
            guild.leader = row[3]
            guild.member_count = row[4]
            conn.close()
            return guild
        
        conn.close()
        return None

    @rpc(Unicode, Unicode, Unicode, _returns=Guild)
    def create_guild(ctx, name, description, leader):
        """Cria uma nova guilda"""
        conn = ctx.descriptor.service_class.get_db_connection(ctx.descriptor.service_class)
        cursor = conn.cursor()
        
        try:
            cursor.execute('INSERT INTO guilds (name, description, leader, member_count) VALUES (?, ?, ?, 1)', 
                         (name, description, leader))
            guild_id = cursor.lastrowid
            
            # Adiciona o líder como membro
            cursor.execute('INSERT INTO guild_members (character_name, guild_id, rank, join_date) VALUES (?, ?, ?, datetime("now"))', 
                         (leader, guild_id, 'Leader'))
            
            conn.commit()
            
            # Retorna a guilda criada
            guild = Guild()
            guild.id = guild_id
            guild.name = name
            guild.description = description
            guild.leader = leader
            guild.member_count = 1
            
            conn.close()
            return guild
            
        except sqlite3.IntegrityError:
            conn.close()
            return None

    @rpc(Integer, Unicode, _returns=Unicode)
    def join_guild(ctx, guild_id, character_name):
        """Adiciona um personagem a uma guilda"""
        conn = ctx.descriptor.service_class.get_db_connection(ctx.descriptor.service_class)
        cursor = conn.cursor()
        
        # Verifica se a guilda existe
        cursor.execute('SELECT id FROM guilds WHERE id = ?', (guild_id,))
        if not cursor.fetchone():
            conn.close()
            return "Guild not found"
        
        # Verifica se o personagem já está na guilda
        cursor.execute('SELECT id FROM guild_members WHERE character_name = ? AND guild_id = ?', (character_name, guild_id))
        if cursor.fetchone():
            conn.close()
            return "Character already in guild"
        
        # Adiciona o membro
        cursor.execute('INSERT INTO guild_members (character_name, guild_id, rank, join_date) VALUES (?, ?, ?, datetime("now"))', 
                     (character_name, guild_id, 'Member'))
        
        # Atualiza o contador de membros
        cursor.execute('UPDATE guilds SET member_count = member_count + 1 WHERE id = ?', (guild_id,))
        
        conn.commit()
        conn.close()
        return f"Character {character_name} joined guild successfully"

    @rpc(Integer, _returns=Iterable(Member))
    def get_guild_members(ctx, guild_id):
        """Retorna todos os membros de uma guilda"""
        conn = ctx.descriptor.service_class.get_db_connection(ctx.descriptor.service_class)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, character_name, guild_id, rank, join_date FROM guild_members WHERE guild_id = ?', (guild_id,))
        members = []
        
        for row in cursor.fetchall():
            member = Member()
            member.id = row[0]
            member.character_name = row[1]
            member.guild_id = row[2]
            member.rank = row[3]
            member.join_date = row[4]
            members.append(member)
        
        conn.close()
        return members

# Configuração da aplicação SOAP
application = Application([GuildService], 'http://ashennetwork.soap/guild',
                         in_protocol=Soap11(validator='lxml'),
                         out_protocol=Soap11())

wsgi_application = WsgiApplication(application)

if __name__ == '__main__':
    print("=== Ashen Network SOAP Server ===")
    print("Servidor SOAP de Guildas do Dark Souls")
    print("WSDL disponível em: http://localhost:8000/?wsdl")
    print("Porta: 8000")
    print("====================================")
    
    # Inicializa o banco antes de iniciar o servidor
    service = GuildService()
    
    run_simple('localhost', 8000, wsgi_application, use_reloader=True, use_debugger=True)

#!/usr/bin/env python3
"""
Script para limpar todos os bancos de dados do Ashen Network
Uso: python3 clear_database.py
"""

import os
import sqlite3

def clear_characters_db():
    """Limpa o banco de personagens"""
    db_path = os.path.join('data', 'dark_souls.db')
    
    if os.path.exists(db_path):
        print(f"🗑️  Limpando banco de personagens: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Limpar tabelas
        cursor.execute('DELETE FROM character_items')
        cursor.execute('DELETE FROM characters')
        cursor.execute('DELETE FROM items')
        
        # Reset auto-increment
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('characters', 'items', 'character_items')")
        
        conn.commit()
        conn.close()
        print("✅ Banco de personagens limpo!")
    else:
        print("ℹ️  Banco de personagens não existe ainda")

def clear_guilds_db():
    """Limpa o banco de guildas"""
    db_path = os.path.join('data', 'guilds.db')
    
    if os.path.exists(db_path):
        print(f"🗑️  Limpando banco de guildas: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Limpar tabelas
        cursor.execute('DELETE FROM guild_members')
        cursor.execute('DELETE FROM guilds')
        
        # Reset auto-increment
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('guilds', 'guild_members')")
        
        conn.commit()
        conn.close()
        print("✅ Banco de guildas limpo!")
    else:
        print("ℹ️  Banco de guildas não existe ainda")

def remove_databases():
    """Remove completamente os arquivos de banco"""
    databases = [
        'data/dark_souls.db',
        'data/guilds.db'
    ]
    
    for db_path in databases:
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"🗑️  Arquivo removido: {db_path}")
        else:
            print(f"ℹ️  Arquivo não existe: {db_path}")

def main():
    print("🏰 === Ashen Network Database Cleaner ===")
    print("Este script vai limpar todos os dados dos bancos de dados")
    print()
    
    choice = input("Escolha uma opção:\n1. Limpar dados (manter estrutura)\n2. Remover arquivos completamente\n3. Cancelar\nOpção: ").strip()
    
    if choice == "1":
        print("\n🧹 Limpando dados dos bancos...")
        clear_characters_db()
        clear_guilds_db()
        print("\n✅ Todos os dados foram limpos! Os bancos estão vazios e prontos para uso.")
        
    elif choice == "2":
        confirm = input("\n⚠️  ATENÇÃO: Isso vai DELETAR completamente os arquivos de banco!\nTem certeza? (digite 'SIM' para confirmar): ").strip()
        if confirm == "SIM":
            print("\n🗑️  Removendo arquivos de banco...")
            remove_databases()
            print("\n✅ Todos os arquivos de banco foram removidos!")
            print("💡 Os bancos serão recriados automaticamente quando os serviços iniciarem.")
        else:
            print("❌ Operação cancelada.")
            
    elif choice == "3":
        print("❌ Operação cancelada.")
        
    else:
        print("❌ Opção inválida!")

if __name__ == "__main__":
    main()

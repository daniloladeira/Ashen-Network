@echo off
title Ashen Network - Teste Automatizado
echo.
echo ==========================================
echo   ASHEN NETWORK - TESTE AUTOMATIZADO
echo ==========================================
echo.
echo Este script testará todas as funcionalidades:
echo • Health check do Gateway
echo • API REST (personagens)
echo • Serviço SOAP (guildas) + WSDL
echo • Integração REST + SOAP
echo • Dashboard combinado
echo • Implementação HATEOAS
echo.
echo IMPORTANTE: Certifique-se de que todos os serviços estão rodando:
echo • REST API (porta 3001)
echo • SOAP Service (porta 8000)
echo • API Gateway (porta 4000)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo Instalando dependência axios...
npm install axios

echo.
echo Executando testes...
node test-integration.js

echo.
echo ==========================================
echo         TESTE CONCLUÍDO
echo ==========================================
pause

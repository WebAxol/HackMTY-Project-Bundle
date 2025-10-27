# MCP Server Tools

Este directorio contiene herramientas adicionales disponibles a través del servidor MCP.

## Herramientas Disponibles

### 1. Perplexity News Integration

**Ubicación**: `tools/perplexity/`

**Descripción**: Simula la integración con Perplexity AI para obtener noticias e inteligencia competitiva sobre empresas.

**Características**:
- ✅ Implementación MOCK - No consume créditos de API
- ✅ Datos de prueba pre-configurados para varias empresas
- ✅ Análisis de impacto (Alta amenaza, Riesgo moderado, Oportunidad)
- ✅ Información sobre competidores, regulaciones y tendencias de mercado

**Archivos**:
- `news_mocks.py` - Base de datos de noticias simuladas
- `main.py` - Implementación original con API real (comentada)
- `__init__.py` - Configuración del módulo

**Uso a través de MCP**:

```python
# Ejemplo de llamada a la tool
result = await client.call_tool(
    "get_company_news",
    arguments={
        "company_name": "OpenAI",
        "num_news": 5
    }
)
```

**Empresas disponibles en datos mock**:
- `openai` - Noticias sobre IA y competidores en el sector
- `tesla` - Noticias sobre vehículos eléctricos y competencia
- `default` - Noticias generales de tecnología

**Estructura de respuesta**:

```json
[
  {
    "title": "Título de la noticia",
    "source": "Fuente y fecha",
    "link": "URL del artículo",
    "impact": "Alta amenaza | Riesgo moderado | Oportunidad",
    "impact_explanation": "Explicación del impacto en la empresa"
  }
]
```

## Agregar Nuevas Herramientas

Para agregar una nueva herramienta:

1. Crea un nuevo directorio en `tools/`
2. Implementa tu lógica en archivos Python
3. Crea un `__init__.py` para exportar funciones principales
4. Registra la tool en `mcp_server.py` usando el decorador `@mcp.tool()`
5. Actualiza este README con la documentación

## Notas de Desarrollo

- **Testing**: Usa implementaciones MOCK para desarrollo sin consumir APIs de pago
- **Producción**: Cambia a implementaciones reales cuando esté listo para producción
- **Credenciales**: Usa variables de entorno para API keys (nunca en el código)
- **Documentación**: Mantén docstrings claros en cada tool para que ChatGPT las entienda

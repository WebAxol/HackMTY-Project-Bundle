# Client Component API Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [REST API Endpoints](#rest-api-endpoints)
- [Data Models](#data-models)
- [LLM Response Format](#llm-response-format)
- [Core Components](#core-components)
- [Environment Variables](#environment-variables)
- [Usage Examples](#usage-examples)

---

## Overview

The Client component provides a REST API that integrates ChatGPT with an MCP (Model Context Protocol) server to interact with MySQL databases and external services through natural language queries.

### Key Features
- **Natural Language to SQL**: Convert user questions to SQL queries using ChatGPT
- **Session Management**: Multi-session support with conversation history
- **Tool Integration**: Access to database tools, company news, and financial analysis
- **Structured Responses**: JSON responses with text, table, and chart data types
- **Web Interface**: Built-in HTML chat interface

### Tech Stack
- **Framework**: FastAPI (async REST API)
- **LLM**: OpenAI GPT-4o (with OpenRouter support)
- **MCP Client**: FastMCP for tool calling
- **Data Validation**: Pydantic v2

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Component                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌───────────────────────────┐        │
│  │  main.py     │──────│  FastAPI REST API         │        │
│  │  (API Server)│      │  - /api/chat              │        │
│  └──────────────┘      │  - /api/session           │        │
│         │              │  - /health                │        │
│         │              └───────────────────────────┘        │
│         ▼                                                   │
│  ┌──────────────────────────────────────────────┐           │
│  │  chatgpt_mcp_integration.py                  │           │
│  │  - OpenAI API integration                    │           │
│  │  - Function calling orchestration            │           │
│  │  - Conversation history management           │           │
│  └──────────────────────────────────────────────┘           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────────────────────────────────┐           │
│  │  mcp_client.py                               │           │
│  │  - MCP server connection (SSE/stdio)         │           │
│  │  - Tool discovery and execution              │           │
│  └──────────────────────────────────────────────┘           │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
    ┌─────────────┐
    │ MCP Server  │
    │  (Port 8000)│
    └─────────────┘
```

---

## REST API Endpoints

### Base URL
```
http://localhost:8080
```

### 1. Health Check

**GET** `/health`

Check API status and configuration.

**Response:**
```json
{
  "status": "healthy",
  "mcp_server": "http://mcp-server:8000/mcp",
  "openai_configured": true
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### 2. Create Session

**POST** `/api/session`

Create a new chat session with optional custom system prompt.

**Request Body:**
```json
{
  "system_prompt": "Optional custom system prompt" // optional
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-10-25T12:00:00.000000",
  "message_count": 0
}
```

**Status Codes:**
- `200 OK`: Session created successfully
- `500 Internal Server Error`: OpenAI API key not configured

---

### 3. Chat

**POST** `/api/chat`

Send a message to the assistant and receive a structured JSON response.

**Request Body:**
```json
{
  "message": "What tables are available?",
  "session_id": "550e8400-e29b-41d4-a716-446655440000", // optional
  "system_prompt": "Custom system prompt" // optional
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What tables are available?",
  "response": "{\"title\":\"Available Tables\",\"description\":\"List of tables\",\"data\":[...]}",
  "timestamp": "2025-10-25T12:00:00.000000"
}
```

**Response Field Details:**
- `session_id`: Unique session identifier
- `message`: Original user message
- `response`: JSON string containing the LLM's structured response (see [LLM Response Format](#llm-response-format))
- `timestamp`: ISO 8601 timestamp

**Status Codes:**
- `200 OK`: Message processed successfully
- `401 Unauthorized`: Invalid OpenAI API key
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Processing error

---

### 4. Get Conversation History

**GET** `/api/session/{session_id}/history`

Retrieve the complete conversation history for a session.

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "history": [
    {
      "role": "system",
      "content": "You are a database assistant..."
    },
    {
      "role": "user",
      "content": "What tables are available?"
    },
    {
      "role": "assistant",
      "content": "{\"title\":\"Available Tables\",...}"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: History retrieved successfully
- `404 Not Found`: Session not found

---

### 5. Reset Session

**POST** `/api/session/{session_id}/reset`

Clear conversation history and reset the session to initial state.

**Response:**
```json
{
  "message": "Session reset"
}
```

**Status Codes:**
- `200 OK`: Session reset successfully
- `404 Not Found`: Session not found

---

### 6. Delete Session

**DELETE** `/api/session/{session_id}`

Delete a session and clean up resources.

**Response:**
```json
{
  "message": "Session deleted"
}
```

**Status Codes:**
- `200 OK`: Session deleted successfully
- `404 Not Found`: Session not found

---

### 7. List All Sessions

**GET** `/api/sessions`

Get a list of all active sessions.

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-10-25T12:00:00.000000",
      "message_count": 5
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Sessions listed successfully

---

### 8. Web Interface

**GET** `/`

Serves an interactive HTML chat interface.

**Response:** HTML page with embedded JavaScript chat client

---

## Data Models

### Request Models

#### ChatRequest
```python
class ChatRequest(BaseModel):
    message: str                    # User's message (required)
    session_id: str | None = None   # Optional session ID
    system_prompt: str | None = None # Optional custom system prompt
```

### Response Models

#### ChatResponse
```python
class ChatResponse(BaseModel):
    session_id: str      # Session identifier
    message: str         # Original user message
    response: str        # JSON string with LLM response
    timestamp: str       # ISO 8601 timestamp
```

#### SessionInfo
```python
class SessionInfo(BaseModel):
    session_id: str      # Unique session ID
    created_at: str      # ISO 8601 creation timestamp
    message_count: int   # Number of messages exchanged
```

#### HealthResponse
```python
class HealthResponse(BaseModel):
    status: str              # Service status
    mcp_server: str          # MCP server URL
    openai_configured: bool  # OpenAI API key status
```

---

## LLM Response Format

The LLM returns responses in a structured JSON format with three possible data types.

### Response Structure

```json
{
  "title": "Brief title of the response",
  "description": "Concise description of the information provided",
  "data": [
    // Array of objects - each MUST be one of: "text", "table", or "chart"
  ]
}
```

### Data Types

#### 1. Text Data

For plain text explanations and messages.

```python
class TextData(BaseModel):
    type: Literal["text"] = "text"
    content: str  # Plain text content
```

**Example:**
```json
{
  "type": "text",
  "content": "There are 150 users in the database"
}
```

#### 2. Table Data

For structured tabular information.

```python
class TableData(BaseModel):
    type: Literal["table"] = "table"
    columns: List[str]         # Column headers
    rows: List[List[Any]]      # Table rows
```

**Example:**
```json
{
  "type": "table",
  "columns": ["ID", "Name", "Email"],
  "rows": [
    [1, "John Doe", "john@example.com"],
    [2, "Jane Smith", "jane@example.com"]
  ]
}
```

#### 3. Chart Data

For X vs Y numerical visualizations.

```python
class AxisData(BaseModel):
    label: str            # Axis label
    values: List[Any]     # Data points

class ChartData(BaseModel):
    type: Literal["chart"] = "chart"
    chart_type: str = "xy"  # Currently only "xy" supported
    x_axis: AxisData
    y_axis: AxisData
```

**Example:**
```json
{
  "type": "chart",
  "chart_type": "xy",
  "x_axis": {
    "label": "Month",
    "values": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
  },
  "y_axis": {
    "label": "Sales (MXN)",
    "values": [45000, 52000, 48000, 61000, 58000, 63000]
  }
}
```

### Complete Response Example

```json
{
  "title": "Users Table Analysis",
  "description": "Structure and statistics for the users table",
  "data": [
    {
      "type": "text",
      "content": "The users table contains customer information with 150 total records."
    },
    {
      "type": "table",
      "columns": ["Column Name", "Data Type", "Nullable"],
      "rows": [
        ["id", "INT", "NO"],
        ["name", "VARCHAR(255)", "NO"],
        ["email", "VARCHAR(255)", "YES"],
        ["created_at", "DATETIME", "NO"]
      ]
    }
  ]
}
```

---

## Core Components

### 1. main.py - REST API Server

The main FastAPI application that exposes HTTP endpoints.

**Key Functions:**

#### `get_default_system_prompt() -> str`
Returns the comprehensive system prompt that instructs the LLM on:
- Response format (JSON with text/table/chart types)
- Available tools (database, news, financial analysis)
- Rules and examples

#### `get_or_create_session(session_id, system_prompt) -> tuple[str, ChatGPTMCPIntegration]`
Manages session lifecycle:
- Creates new sessions with UUID
- Retrieves existing sessions from in-memory store
- Initializes ChatGPT integration with MCP client

**Configuration:**
```python
app = FastAPI(
    title="ChatGPT Database Assistant API",
    description="API for interacting with MySQL database through ChatGPT",
    version="1.0.0"
)
```

**CORS:** Enabled for all origins (configure for production)

**Session Storage:** In-memory dictionary (use Redis for production)

---

### 2. chatgpt_mcp_integration.py

Integrates OpenAI's ChatGPT with MCP server tools using function calling.

**Class: `ChatGPTMCPIntegration`**

#### Constructor
```python
def __init__(
    self,
    api_key: str,
    model: str = "gpt-4o",
    mcp_server_url: str | None = "http://mcp-server:8000/mcp"
)
```

**Parameters:**
- `api_key`: OpenAI API key (supports OpenRouter with `sk-or-v1-` prefix)
- `model`: GPT model to use (default: `gpt-4o`)
- `mcp_server_url`: URL to MCP server including `/mcp` path

#### Key Methods

**`async chat(user_message, system_prompt=None, max_iterations=10) -> str`**

Main chat method with automatic tool calling.

**Flow:**
1. Add user message to conversation history
2. Call OpenAI API with available tools
3. If LLM requests tool calls:
   - Execute tools via MCP client
   - Add results to conversation
   - Repeat (up to max_iterations)
4. Return final text response

**Parameters:**
- `user_message`: User's question/message
- `system_prompt`: Optional prompt to set context
- `max_iterations`: Max tool calling loops (default: 10)

**Returns:** Final LLM response as string

**Example:**
```python
async with ChatGPTMCPIntegration(api_key=key) as integration:
    response = await integration.chat(
        user_message="How many users are there?",
        system_prompt="You are a database assistant..."
    )
    print(response)
```

**`async chat_streaming(user_message, system_prompt=None)`**

Streaming version of chat (yields response chunks).

**`reset_conversation()`**

Clears conversation history.

**`get_conversation_history() -> list[dict]`**

Returns copy of conversation messages.

---

### 3. mcp_client.py

Low-level client for connecting to MCP server.

**Class: `MySQLMCPClient`**

#### Constructor
```python
def __init__(self, server_url: str | None = None)
```

**Parameters:**
- `server_url`: HTTP URL to MCP server (e.g., `http://localhost:8000/mcp`)
  - If `None`, uses `MCP_SERVER_URL` environment variable
  - Falls back to stdio transport if not provided

#### Key Methods

**`async execute_query(query, params=None, host=None, ...) -> str`**

Execute SQL SELECT query through MCP server.

**Parameters:**
- `query`: SQL SELECT statement (required)
- `params`: Optional query parameters for prepared statements
- `host`, `port`, `database`, `user`, `password`: Optional MySQL credentials

**Returns:** Query results as formatted string

**`async list_available_tools() -> list[dict]`**

Discover all tools available from MCP server.

**Returns:** List of tool definitions with schemas
```python
[
  {
    "name": "execute_select_query",
    "description": "Execute a SELECT query on MySQL",
    "input_schema": {...}
  }
]
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `MCP_SERVER_URL` | MCP server endpoint | `http://mcp-server:8000/mcp` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAT_API_HOST` | API server bind address | `0.0.0.0` |
| `CHAT_API_PORT` | API server port | `8000` |

---

## Available Tools

The LLM has access to the following tools through the MCP server:

### 1. list_tables
Get all database tables.

### 2. describe_table
Get table structure (columns, types, constraints).

### 3. get_database_schema
Get complete database schema.

### 4. execute_select_query
Run SELECT queries (read-only).

**Parameters:**
- `query` (required): SQL SELECT statement

### 5. get_company_news
Fetch company news from Perplexity API.

**Parameters:**
- `company_name` (required)
- `competitors` (optional): List of competitor names
- `num_news` (optional): Number of news items (default: 5)

**Returns:** Table with columns: Title, Source, Link, Impact, Explanation

### 6. what_if_analysis
ML-based financial feasibility prediction.

**Parameters:**
- `monto` (required): Amount in MXN
- `fecha` (required): Date (YYYY-MM-DD)
- `categoria` (required): Category (ventas/personal/infraestructura/costos/impuestos)

**Returns:** Feasibility classification, probability, cash flow projections

---

## Usage Examples

### 1. Python Client

```python
import httpx
import json

# Create session
response = httpx.post("http://localhost:8080/api/session")
session = response.json()
session_id = session["session_id"]

# Send message
response = httpx.post("http://localhost:8080/api/chat", json={
    "message": "What tables are available?",
    "session_id": session_id
})

chat_response = response.json()
llm_response = json.loads(chat_response["response"])

print(f"Title: {llm_response['title']}")
print(f"Description: {llm_response['description']}")

for item in llm_response["data"]:
    if item["type"] == "table":
        print(f"Columns: {item['columns']}")
        print(f"Rows: {item['rows']}")
```

### 2. cURL Examples

**Health check:**
```bash
curl http://localhost:8080/health
```

**Create session:**
```bash
curl -X POST http://localhost:8080/api/session
```

**Send chat message:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many users are there?",
    "session_id": "YOUR_SESSION_ID"
  }'
```

**Get conversation history:**
```bash
curl http://localhost:8080/api/session/YOUR_SESSION_ID/history
```

### 3. JavaScript/Fetch

```javascript
// Create session
const sessionResp = await fetch('http://localhost:8080/api/session', {
  method: 'POST'
});
const session = await sessionResp.json();

// Send message
const chatResp = await fetch('http://localhost:8080/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me sales by month',
    session_id: session.session_id
  })
});

const chatData = await chatResp.json();
const llmResponse = JSON.parse(chatData.response);

// Handle different data types
llmResponse.data.forEach(item => {
  switch(item.type) {
    case 'text':
      console.log(item.content);
      break;
    case 'table':
      console.table(item.rows);
      break;
    case 'chart':
      // Render chart with item.x_axis and item.y_axis
      break;
  }
});
```

---

## Error Handling

### API Errors

| Status Code | Meaning | Response |
|-------------|---------|----------|
| `401` | Invalid OpenAI API key | `{"detail": "OpenAI API key is invalid or missing..."}` |
| `404` | Session not found | `{"detail": "Session not found"}` |
| `429` | Rate limit exceeded | `{"detail": "OpenAI API rate limit exceeded..."}` |
| `500` | Internal server error | `{"detail": "Error message"}` |

### LLM Error Responses

When tools fail, the LLM returns an error in the response format:

```json
{
  "title": "Error",
  "description": "Description of what went wrong",
  "data": [
    {
      "type": "text",
      "content": "Error: Connection failed (Type: connection_error)"
    }
  ]
}
```

---

## Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="sk-..."
export MCP_SERVER_URL="http://localhost:8000/mcp"

# Run server
python main.py
```

### Running with Docker

```bash
# Build and start
docker compose up -d mcp-client

# View logs
docker logs -f liquid-mcp-client

# Access web interface
open http://localhost:8080
```

### Testing

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test chat endpoint
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What tables are available?"}'
```

---

## Production Considerations

### Security
- [ ] Configure CORS for specific origins
- [ ] Add API authentication (JWT/OAuth)
- [ ] Validate and sanitize all inputs
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly

### Performance
- [ ] Replace in-memory sessions with Redis
- [ ] Implement rate limiting
- [ ] Add response caching
- [ ] Use connection pooling
- [ ] Monitor OpenAI API usage

### Reliability
- [ ] Add request timeout handling
- [ ] Implement retry logic for API calls
- [ ] Add circuit breakers for external services
- [ ] Set up health checks and monitoring
- [ ] Configure logging and alerting

---

## Troubleshooting

### Common Issues

**Issue:** `OPENAI_API_KEY not configured`
- **Solution:** Set the `OPENAI_API_KEY` environment variable

**Issue:** `Connection refused to MCP server`
- **Solution:** Ensure MCP server is running and `MCP_SERVER_URL` is correct

**Issue:** `Rate limit exceeded`
- **Solution:** Wait or upgrade OpenAI API plan

**Issue:** Session not persisting
- **Solution:** In-memory storage is not persistent. Use Redis for production.

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

View detailed tool calls in logs:
```
[DEBUG] Calling tool: execute_select_query
[DEBUG] Arguments: {'query': 'SELECT * FROM users'}
[DEBUG] Tool result: {...}
```

---

## API Versioning

**Current Version:** 1.0.0

Future versions will maintain backward compatibility for:
- All `/api/*` endpoints
- Request/response models
- LLM response data types (text, table, chart)

New data types will be added without breaking existing types.

---

## License

See main project LICENSE file.

---

## Support

For issues and questions:
- GitHub Issues: [project repository]
- Documentation: This README
- Examples: See `examples/` directory

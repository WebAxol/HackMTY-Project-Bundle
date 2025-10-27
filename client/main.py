"""
REST API for ChatGPT MCP Integration.
Exposes endpoints for clients to interact with the database through ChatGPT.
"""
import os
import uuid
from typing import Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Union, List, Any, Literal

from chatgpt_mcp_integration import ChatGPTMCPIntegration

# FastAPI app
app = FastAPI(
    title="ChatGPT Database Assistant API",
    description="API for interacting with MySQL database through ChatGPT",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage (use Redis in production)
sessions: Dict[str, Dict[str, Any]] = {}


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    response: str
    timestamp: str


class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    message_count: int


class HealthResponse(BaseModel):
    status: str
    mcp_server: str
    openai_configured: bool


# LLM Response Data Type Models (for validation and documentation)
class TextData(BaseModel):
    """Plain text data type."""
    type: Literal["text"] = "text"
    content: str = Field(..., description="Plain text content")


class AxisData(BaseModel):
    """Axis configuration for charts."""
    label: str = Field(..., description="Axis label")
    values: List[Any] = Field(..., description="Axis values (numbers or strings)")


class TableData(BaseModel):
    """Tabular data type."""
    type: Literal["table"] = "table"
    columns: List[str] = Field(..., description="Column headers")
    rows: List[List[Any]] = Field(..., description="Table rows as arrays of values")


class ChartData(BaseModel):
    """Chart data type for X vs Y graphs."""
    type: Literal["chart"] = "chart"
    chart_type: str = Field(default="xy", description="Chart type (currently only 'xy' supported)")
    x_axis: AxisData = Field(..., description="X axis configuration")
    y_axis: AxisData = Field(..., description="Y axis configuration")


class LLMResponse(BaseModel):
    """Complete LLM response structure."""
    title: str = Field(..., description="Brief title of the response")
    description: str = Field(..., description="Concise description of the information provided")
    data: List[Union[TextData, TableData, ChartData]] = Field(
        ...,
        description="Array of data objects (text, table, or chart types)"
    )


# Helper functions
def get_openai_key() -> str:
    """Get OpenAI API key from environment."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured"
        )
    return api_key


def get_mcp_server_url() -> str:
    """Get MCP server URL from environment."""
    return os.getenv("MCP_SERVER_URL", "http://localhost:8000/mcp")


def get_default_system_prompt() -> str:
    """Get default system prompt for database assistant."""
    return """You are a database assistant API that responds ONLY in JSON format.

## DATABASE SCHEMA (ONLY use these tables and columns):

**Company** (id, type, name, address, phone, email)
- Company information

**Department** (id, name)
- Company departments (e.g., Marketing, Finanzas, Recursos Humanos, etc.)

**Person** (id, first_name, last_name, email, phone, address)
- All persons (customers and employees)

**Employee** (id, person_id, position, hire_date, department_id, salary)
- Employee details (links to Person via person_id)

**Supplier** (id, name, contact, phone, email)
- Product suppliers

**Product** (id, name, description, price, stock, supplier_id)
- Products with pricing and inventory

**Sale** (id, date, sale_total, person_id)
- Sales transactions (person_id links to Person as customer)

**SaleDetail** (id, sale_id, product_id, quantity, unit_price)
- Line items for each sale

**Expense** (id, date, amount, expense_type, department_id)
- Company expenses by department

## ENTITY MAPPING (Spanish → English):

When users ask about entities in Spanish, map them to the correct table names:

- "ventas" / "venta" → **Sale** table
- "clientes" / "cliente" → **Person** table (customers are persons not marked as employees)
- "empleados" / "empleado" → **Employee** table (join with Person for full details)
- "productos" / "producto" → **Product** table
- "proveedores" / "proveedor" → **Supplier** table
- "gastos" / "gasto" → **Expense** table
- "departamentos" / "departamento" → **Department** table
- "compañía" / "empresa" → **Company** table
- "personas" → **Person** table

CRITICAL - OUTPUT FORMAT:
You MUST respond with ONLY valid JSON following this EXACT structure. No additional text, no explanations, no markdown:

{
  "title": "Brief title of the response",
  "description": "Concise description of the information provided",
  "data": [
    // Array of objects - each object MUST be one of three types: "text", "table", or "chart"
  ]
}

DATA TYPES:
The "data" array contains objects of THREE possible types. Each object MUST include a "type" field:

1. TEXT (Plain text):
{
  "type": "text",
  "content": "Your plain text content here"
}

2. TABLE (Tabular data):
{
  "type": "table",
  "columns": ["Column1", "Column2", "Column3"],
  "rows": [
    ["value1", "value2", "value3"],
    ["value4", "value5", "value6"]
  ]
}

3. CHART (X vs Y graph):
{
  "type": "chart",
  "chart_type": "xy",
  "x_axis": {
    "label": "X axis label",
    "values": [1, 2, 3, 4, 5]
  },
  "y_axis": {
    "label": "Y axis label",
    "values": [10, 20, 15, 30, 25]
  }
}

AVAILABLE TOOLS:
1. list_tables - Get all database tables
2. describe_table - Get table structure
3. get_database_schema - Get complete database schema
4. execute_select_query - Run SELECT queries (only 'query' parameter)
5. get_company_news - Get company news from Perplexity API
6. what_if_analysis - ML-based financial feasibility prediction
   - Requires: monto (amount in MXN), fecha (YYYY-MM-DD), categoria (ventas/personal/infraestructura/costos/impuestos)
   - Returns: feasibility classification, probability, and cash flow projections

CRITICAL DATABASE RULES:
1. **ONLY query tables and columns that exist in the schema above**
2. **Use EXACT table and column names** (case-sensitive)
3. **Never invent or guess table/column names**
4. **Identify entities** using the Spanish → English mapping above
5. Database credentials are pre-configured. NEVER provide host, port, database, user, or password parameters

IMPORTANT RULES:
- All tools return JSON. Parse their responses and structure them using the three data types (text, table, or chart)
- Your response must be PURE JSON - no text before or after the JSON object
- Choose the appropriate data type based on the content: use "text" for explanations, "table" for structured data, "chart" for numerical trends
- You can mix different types in the same response
- When presenting news from get_company_news tool, ALWAYS include the "link" field as a column in the table format

EXAMPLES:

User: "What tables are available?"
Your response:
{
  "title": "Available Tables",
  "description": "List of all tables in the database",
  "data": [
    {
      "type": "table",
      "columns": ["Table Name"],
      "rows": [
        ["users"],
        ["products"],
        ["orders"]
      ]
    }
  ]
}

User: "How many users are there?"
Your response:
{
  "title": "User Count",
  "description": "Total number of users in the database",
  "data": [
    {
      "type": "text",
      "content": "There are 150 users in the database"
    }
  ]
}

User: "Show me sales by month"
Your response:
{
  "title": "Monthly Sales",
  "description": "Sales performance over the last 6 months",
  "data": [
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
  ]
}

User: "Describe the users table"
Your response:
{
  "title": "Users Table Structure",
  "description": "Schema and column information for the users table",
  "data": [
    {
      "type": "text",
      "content": "The users table contains customer information with the following columns:"
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

User: "Get news about OpenAI"
Your response:
{
  "title": "OpenAI News",
  "description": "Latest news and competitive intelligence for OpenAI",
  "data": [
    {
      "type": "table",
      "columns": ["Title", "Source", "Link", "Impact", "Explanation"],
      "rows": [
        ["OpenAI releases GPT-5", "TechCrunch", "https://techcrunch.com/...", "High threat", "Major advancement in AI capabilities"],
        ["New partnership announced", "Bloomberg", "https://bloomberg.com/...", "Opportunity", "Potential collaboration avenue"]
      ]
    }
  ]
}

ERROR HANDLING:
If a tool returns an error, respond with:
{
  "title": "Error",
  "description": "Description of what went wrong",
  "data": [
    {
      "type": "text",
      "content": "Error: [error message] (Type: [error_type])"
    }
  ]
}

REMEMBER:
- Your entire response must be valid JSON. Nothing else.
- ALWAYS include the "type" field in every data object
- Choose between "text", "table", or "chart" based on the content
- More types will be added in the future, but for now only use these three"""


async def get_or_create_session(
    session_id: str | None,
    system_prompt: str | None
) -> tuple[str, ChatGPTMCPIntegration]:
    
    """Get existing session or create a new one."""
    
    print(session_id, system_prompt)

    # Generate new session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    # Check if session exists
    if session_id in sessions:
        integration = sessions[session_id]["integration"]
        return session_id, integration

    # Create new session
    api_key = get_openai_key()
    server_url = get_mcp_server_url()

    integration = ChatGPTMCPIntegration(
        api_key=api_key,
        mcp_server_url=server_url
    )

    await integration.__aenter__()

    # Set system prompt if provided
    if system_prompt:
        integration.conversation_history.append({
            "role": "system",
            "content": system_prompt
        })
    else:
        integration.conversation_history.append({
            "role": "system",
            "content": get_default_system_prompt()
        })

    sessions[session_id] = {
        "integration": integration,
        "created_at": datetime.now().isoformat(),
        "message_count": 0
    }

    return session_id, integration


# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the web interface."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>ChatGPT Database Assistant</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { opacity: 0.9; }
            .chat-container {
                height: 500px;
                overflow-y: auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .message {
                margin-bottom: 15px;
                padding: 12px 16px;
                border-radius: 8px;
                max-width: 80%;
                word-wrap: break-word;
            }
            .user-message {
                background: #667eea;
                color: white;
                margin-left: auto;
                text-align: right;
            }
            .assistant-message {
                background: white;
                border: 1px solid #e0e0e0;
            }
            .assistant-message pre {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                margin: 10px 0;
            }
            .input-container {
                padding: 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
            }
            #messageInput {
                flex: 1;
                padding: 12px;
                border: 2px solid #e0e0e0;
                border-radius: 5px;
                font-size: 14px;
            }
            #messageInput:focus {
                outline: none;
                border-color: #667eea;
            }
            button {
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
            }
            button:hover { opacity: 0.9; }
            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .info {
                padding: 15px;
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                margin: 15px;
                border-radius: 5px;
            }
            .session-id {
                font-family: monospace;
                font-size: 12px;
                color: #666;
                padding: 10px 20px;
                background: #f5f5f5;
                border-bottom: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 ChatGPT Database Assistant</h1>
                <p>Ask questions about your database in natural language</p>
            </div>

            <div class="session-id">Session ID: <span id="sessionId">Loading...</span></div>

            <div class="info">
                💡 <strong>Try asking:</strong>
                <ul style="margin-top: 10px; margin-left: 20px;">
                    <li>"What tables are available?"</li>
                    <li>"Show me the structure of the users table"</li>
                    <li>"How many users are registered?"</li>
                    <li>"List all products with their prices"</li>
                </ul>
            </div>

            <div class="chat-container" id="chatContainer"></div>

            <div class="input-container">
                <input
                    type="text"
                    id="messageInput"
                    placeholder="Ask a question about your database..."
                    onkeypress="if(event.key==='Enter') sendMessage()"
                >
                <button onclick="sendMessage()" id="sendBtn">Send</button>
            </div>
        </div>

        <script>
            let sessionId = null;

            // Initialize session on page load
            window.onload = () => {
                initSession();
            };

            async function initSession() {
                try {
                    const response = await fetch('/api/session', { method: 'POST' });
                    const data = await response.json();
                    sessionId = data.session_id;
                    document.getElementById('sessionId').textContent = sessionId;
                } catch (error) {
                    console.error('Error initializing session:', error);
                    addMessage('assistant', 'Error connecting to server. Please refresh the page.');
                }
            }

            async function sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();

                if (!message) return;

                // Add user message to chat
                addMessage('user', message);
                input.value = '';

                // Disable send button
                const sendBtn = document.getElementById('sendBtn');
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<span class="loading"></span>';

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: message,
                            session_id: sessionId
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Server error');
                    }

                    const data = await response.json();

                    // Add assistant response to chat
                    addMessage('assistant', data.response);

                } catch (error) {
                    console.error('Error:', error);
                    addMessage('assistant', '❌ Error: ' + error.message);
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = 'Send';
                }
            }

            function addMessage(role, content) {
                const container = document.getElementById('chatContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${role}-message`;

                // Format code blocks
                const formatted = content.replace(/```sql\\n([\\s\\S]*?)```/g, '<pre>$1</pre>');
                messageDiv.innerHTML = formatted.replace(/\\n/g, '<br>');

                container.appendChild(messageDiv);
                container.scrollTop = container.scrollHeight;
            }
        </script>
    </body>
    </html>
    """


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mcp_server": get_mcp_server_url(),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


@app.post("/api/session", response_model=SessionInfo)
async def create_session(system_prompt: str | None = None):
    """Create a new chat session."""

    session_id, integration = await get_or_create_session(None, system_prompt)

    return {
        "session_id": session_id,
        "created_at": sessions[session_id]["created_at"],
        "message_count": 0
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get a response."""
    try:
        # Get or create session
        session_id, integration = await get_or_create_session(
            request.session_id,
            request.system_prompt
        )

        # Send message to ChatGPT
        response = await integration.chat(request.message)

        # Update message count
        sessions[session_id]["message_count"] += 1

        return {
            "session_id": session_id,
            "message": request.message,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        # Handle OpenAI API errors specifically
        error_message = str(e)

        # Check if it's an OpenAI authentication error
        if "401" in error_message or "invalid_api_key" in error_message.lower():
            raise HTTPException(
                status_code=401,
                detail="OpenAI API key is invalid or missing. Please configure a valid OPENAI_API_KEY."
            )

        # Check if it's an OpenAI rate limit error
        if "429" in error_message or "rate_limit" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="OpenAI API rate limit exceeded. Please try again later."
            )

        # For other errors, log and return 500
        print(f"Error in chat endpoint: {error_message}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}/history")
async def get_history(session_id: str):
    """Get conversation history for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    integration = sessions[session_id]["integration"]
    return {
        "session_id": session_id,
        "history": integration.get_conversation_history()
    }


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Clean up integration
    integration = sessions[session_id]["integration"]
    await integration.__aexit__(None, None, None)

    del sessions[session_id]

    return {"message": "Session deleted"}


@app.post("/api/session/{session_id}/reset")
async def reset_session(session_id: str):
    """Reset conversation history for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    integration = sessions[session_id]["integration"]
    integration.reset_conversation()

    # Re-add system prompt
    integration.conversation_history.append({
        "role": "system",
        "content": get_default_system_prompt()
    })

    sessions[session_id]["message_count"] = 0

    return {"message": "Session reset"}


@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions."""
    return {
        "sessions": [
            {
                "session_id": sid,
                "created_at": info["created_at"],
                "message_count": info["message_count"]
            }
            for sid, info in sessions.items()
        ]
    }


if __name__ == "__main__":
    import uvicorn

    port = 8000
    host = os.getenv("CHAT_API_HOST", "0.0.0.0")

    print(f"Starting Chat API on {host}:{port}")
    print(f"MCP Server: {get_mcp_server_url()}")
    print(f"OpenAI configured: {bool(os.getenv('OPENAI_API_KEY'))}")

    uvicorn.run(app, host=host, port=port)

"""
ChatGPT MCP Integration.
Integrates the MCP MySQL client with ChatGPT API using function calling.
"""
import json
from typing import Any
from openai import AsyncOpenAI

from mcp_client import MySQLMCPClient


# Default system prompt for database queries
DEFAULT_DB_SYSTEM_PROMPT = """You are a specialized database assistant with access to a MySQL business database.

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

## CRITICAL RULES:

1. **ONLY query tables and columns that exist in the schema above**
2. **Use EXACT table and column names** (case-sensitive)
3. **Never invent or guess table/column names**

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

## QUERY EXAMPLES:

- Top customers: `SELECT p.first_name, p.last_name, SUM(s.sale_total) as total FROM Sale s JOIN Person p ON s.person_id = p.id GROUP BY p.id ORDER BY total DESC LIMIT 10`
- Sales by month: `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(sale_total) as total FROM Sale GROUP BY month ORDER BY month`
- Employee salaries by department: `SELECT d.name, AVG(e.salary) as avg_salary FROM Employee e JOIN Department d ON e.department_id = d.id GROUP BY d.id`

## WORKFLOW:

1. **Identify entities** mentioned by the user (use the mapping above)
2. **Verify** the tables exist in the schema
3. **Construct SQL query** using ONLY valid tables and columns
4. **Execute** the query using execute_select_query tool
5. **Present results** in a clear, formatted way

Always explain what you're about to query before executing."""


class ChatGPTMCPIntegration:
    """
    Integrates ChatGPT with MCP server tools.

    This class allows ChatGPT to execute MySQL queries through the MCP server
    using OpenAI's function calling feature.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        mcp_server_url: str | None = "http://mcp-server:8000/mcp"
    ):
        """
        Initialize the ChatGPT MCP integration.

        Args:
            api_key: OpenAI API key
            model: ChatGPT model to use (default: gpt-4o)
            mcp_server_url: URL to MCP server including /mcp path (e.g., 'http://localhost:8000/mcp')
                          If None, uses MCP_SERVER_URL environment variable
        """
        # Detect if using OpenRouter based on API key prefix
        if api_key and api_key.startswith("sk-or-v1-"):
            # OpenRouter configuration
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            print("Using OpenRouter API")
        else:
            # Standard OpenAI configuration
            self.client = AsyncOpenAI(api_key=api_key)
            print("Using OpenAI API")

        self.model = model
        self.mcp_client = MySQLMCPClient(server_url=mcp_server_url)
        self.tools: list[dict[str, Any]] = []
        self.conversation_history: list[dict[str, Any]] = []

    async def __aenter__(self):
        """Async context manager entry."""
        await self.mcp_client.__aenter__()
        await self._load_tools()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        return await self.mcp_client.__aexit__(exc_type, exc_val, exc_tb)

    async def _load_tools(self):
        """
        Load available tools from MCP server and convert to OpenAI format.
        """
        mcp_tools = await self.mcp_client.list_available_tools()

        self.tools = []
        for tool in mcp_tools:
            openai_tool = {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["input_schema"]
                }
            }
            self.tools.append(openai_tool)

    async def _execute_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """
        Execute a tool call through the MCP client.

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments

        Returns:
            Tool execution result
        """
        # Use the generic call_tool method which works for all MCP tools
        try:
            # Try passing arguments as a dict parameter first
            result = await self.mcp_client.client.call_tool(tool_name, arguments=arguments)
            return str(result)
        except TypeError:
            # If that doesn't work, try unpacking as kwargs
            try:
                result = await self.mcp_client.client.call_tool(tool_name, **arguments)
                return str(result)
            except Exception as e:
                return f"Error calling tool {tool_name}: {str(e)}"
        except Exception as e:
            return f"Error calling tool {tool_name}: {str(e)}"

    async def chat(
        self,
        user_message: str,
        system_prompt: str | None = None,
        max_iterations: int = 10
    ) -> str:
        """
        Send a message to ChatGPT and handle tool calls.

        Args:
            user_message: User's message
            system_prompt: Optional system prompt to set context
            max_iterations: Maximum number of tool call iterations

        Returns:
            ChatGPT's final response
        """
        # Add system prompt if provided and conversation is new
        if system_prompt and not self.conversation_history:
            self.conversation_history.append({
                "role": "system",
                "content": system_prompt
            })

        # Add user message to conversation
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        iteration = 0
        while iteration < max_iterations:
            iteration += 1

            # Call ChatGPT with available tools
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=self.conversation_history,
                tools=self.tools if self.tools else None,
                tool_choice="auto"
            )

            assistant_message = response.choices[0].message

            # Add assistant's response to conversation
            # Only include tool_calls if they exist (OpenAI API doesn't accept empty arrays)
            message_dict = {
                "role": "assistant",
                "content": assistant_message.content
            }

            if assistant_message.tool_calls:
                message_dict["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]

            self.conversation_history.append(message_dict)

            # Check if ChatGPT wants to call a tool
            if not assistant_message.tool_calls:
                # No tool calls, return the response
                return assistant_message.content or ""

            # Execute tool calls
            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                print(f"[DEBUG] Calling tool: {function_name}")
                print(f"[DEBUG] Arguments: {function_args}")

                # Execute the tool
                try:
                    tool_result = await self._execute_tool_call(
                        function_name,
                        function_args
                    )
                    print(f"[DEBUG] Tool result: {tool_result[:200] if len(tool_result) > 200 else tool_result}")
                except Exception as e:
                    tool_result = f"Error executing tool: {str(e)}"
                    print(f"[DEBUG] Tool error: {tool_result}")

                # Add tool result to conversation
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })

        return "Maximum iterations reached. Please try again with a simpler request."

    async def chat_streaming(
        self,
        user_message: str,
        system_prompt: str | None = None
    ):
        """
        Send a message to ChatGPT with streaming response.

        Args:
            user_message: User's message
            system_prompt: Optional system prompt to set context

        Yields:
            Chunks of ChatGPT's response
        """
        # Add system prompt if provided and conversation is new
        if system_prompt and not self.conversation_history:
            self.conversation_history.append({
                "role": "system",
                "content": system_prompt
            })

        # Add user message to conversation
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        # Call ChatGPT with streaming
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=self.conversation_history,
            tools=self.tools if self.tools else None,
            tool_choice="auto",
            stream=True
        )

        collected_messages = []
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                collected_messages.append(content)
                yield content

        # Add complete response to history
        full_response = "".join(collected_messages)
        self.conversation_history.append({
            "role": "assistant",
            "content": full_response
        })

    def reset_conversation(self):
        """Reset the conversation history."""
        self.conversation_history = []

    def get_conversation_history(self) -> list[dict[str, Any]]:
        """
        Get the current conversation history.

        Returns:
            List of conversation messages
        """
        return self.conversation_history.copy()


async def main():
    """Example usage of ChatGPT MCP integration."""
    import os

    # Get OpenAI API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        return

    # Create integration instance
    async with ChatGPTMCPIntegration(api_key=api_key) as integration:
        print("=" * 60)
        print("ChatGPT MCP Integration - Interactive Demo")
        print("=" * 60)

        # Set system prompt (use the default DB system prompt)
        system_prompt = DEFAULT_DB_SYSTEM_PROMPT

        # Example conversation
        queries = [
            "What's the current database and MySQL version?",
            "Can you show me the current time from the database?",
        ]

        for query in queries:
            print(f"\n{'='*60}")
            print(f"User: {query}")
            print(f"{'='*60}")

            response = await integration.chat(
                user_message=query,
                system_prompt=system_prompt
            )

            print(f"\nAssistant: {response}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

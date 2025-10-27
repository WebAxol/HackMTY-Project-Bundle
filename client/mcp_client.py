"""
MCP Client to interact with the MySQL query server.
Provides a simple interface to execute SELECT queries through the MCP server.
"""
import asyncio
import json
import os
from typing import Any

from fastmcp.client import Client


class MySQLMCPClient:
    """
    Client to interact with the MySQL MCP server.

    This client connects to the MCP server and provides methods to execute
    SELECT queries on the configured MySQL database.
    """

    def __init__(self, server_url: str | None = None):
        """
        Initialize the MCP client.

        Args:
            server_url: HTTP URL to MCP server (e.g., 'http://localhost:8000')
                       If None, uses MCP_SERVER_URL environment variable or stdio mode
        """
        # Get server URL from parameter or environment variable
        if server_url is None:
            server_url = os.getenv("MCP_SERVER_URL")

        if server_url:
            # Use HTTP/SSE transport
            print(f"Connecting to MCP server at {server_url}")
            self.client = Client(server_url)
            self.transport = "sse"
        else:
            # Use stdio transport (local development)
            print("Using stdio transport")
            self.client = Client("mcp_server:mcp")
            self.transport = "stdio"

    async def __aenter__(self):
        """Async context manager entry."""
        await self.client.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        return await self.client.__aexit__(exc_type, exc_val, exc_tb)

    async def execute_query(
        self,
        query: str,
        params: list[str | int | None] | None = None,
        host: str | None = None,
        port: int | None = None,
        database: str | None = None,
        user: str | None = None,
        password: str | None = None
    ) -> str:
        """
        Execute a SELECT query on the MySQL database through the MCP server.

        Args:
            query: SELECT SQL query to execute
            params: Optional parameters for the query
            host: MySQL server host (optional)
            port: MySQL server port (optional)
            database: Database name (optional)
            user: Database user (optional)
            password: User password (optional)

        Returns:
            Query results as formatted text
        """
        # Prepare arguments
        kwargs = {"query": query}

        if params is not None:
            kwargs["params"] = params
        if host is not None:
            kwargs["host"] = host
        if port is not None:
            kwargs["port"] = port
        if database is not None:
            kwargs["database"] = database
        if user is not None:
            kwargs["user"] = user
        if password is not None:
            kwargs["password"] = password

        # Call the tool
        result = await self.client.call_tool("execute_select_query", **kwargs)
        return result

    async def list_available_tools(self) -> list[dict[str, Any]]:
        """
        List all available tools from the MCP server.

        Returns:
            List of available tools with their descriptions
        """
        tools = await self.client.list_tools()

        return [
            {
                "name": tool.name if hasattr(tool, 'name') else "",
                "description": tool.description if hasattr(tool, 'description') else "",
                "input_schema": tool.inputSchema if hasattr(tool, 'inputSchema') else {}
            }
            for tool in tools
        ]


async def main():
    """Example usage of the MySQL MCP client."""

    # Create client instance and use it with async context manager
    async with MySQLMCPClient() as client:
        # List available tools
        print("=== Available Tools ===")
        tools = await client.list_available_tools()
        for tool in tools:
            print(f"\nTool: {tool['name']}")
            print(f"Description: {tool['description']}")
            print(f"Schema: {json.dumps(tool['input_schema'], indent=2)}")

        print("\n" + "="*50 + "\n")

        # Example: Execute a simple query
        print("=== Executing Query ===")
        result = await client.execute_query(
            query="SELECT DATABASE(), VERSION(), NOW()"
        )

        print("Response:")
        print(result)


if __name__ == "__main__":
    asyncio.run(main())

"""
MCP server to execute SELECT queries on MySQL.
Exposes a tool that allows executing SELECT SQL queries.
"""
import json
import pandas as pd
from fastmcp import FastMCP

from db_connection import MySQLConnection, get_db_connection_from_env
from tools.perplexity.client import get_real_company_news
from tools.what_if.client import predict_transaction_feasibility


# Create MCP server instance
mcp = FastMCP("mysql-query-server")

@mcp.tool()
async def execute_select_query(
    query: str,
    params: list[str | int | None] | None = None
) -> str:
    """
    Executes a SELECT query on the configured MySQL database.
    Returns results in JSON format with data, column names, and row count.

    Database connection is pre-configured via environment variables.
    Do not attempt to provide database credentials.

    Args:
        query: SELECT SQL query to execute. Only SELECT queries are allowed.
        params: Optional parameters for the query (to use with %s placeholders)

    Returns:
        Query results formatted as text with data, columns, and row count
    """

    # Convert params to tuple if provided
    query_params = tuple(params) if params else None

    try:
        # Use environment variables for connection
        db_conn = get_db_connection_from_env()

        # Execute query using context manager
        with db_conn:
            result = db_conn.execute_select(query, query_params)

        # Format response in standardized JSON structure
        response = {
            "title": "Query Results",
            "description": f"Executed query returned {result['row_count']} rows with {len(result['columns'])} columns",
            "data": [
                {
                    "query": result['query'],
                    "row_count": result['row_count'],
                    "columns": result['columns'],
                    "results": result['data']
                }
            ]
        }

        return json.dumps(response, indent=2, ensure_ascii=False, default=str)

    except ValueError as e:
        # Validation error (query is not SELECT)
        error_response = {
            "title": "Validation Error",
            "description": "Query validation failed",
            "data": [{"error": str(e), "type": "validation_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)
    except ConnectionError as e:
        # Connection error
        error_response = {
            "title": "Connection Error",
            "description": "Failed to connect to database",
            "data": [{"error": str(e), "type": "connection_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)
    except Exception as e:
        # Other errors
        error_response = {
            "title": "Execution Error",
            "description": "Error executing query",
            "data": [{"error": str(e), "type": "execution_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


@mcp.tool()
async def list_tables() -> str:
    """
    Lists all tables available in the configured MySQL database.
    This is useful for exploring what data is available before writing queries.

    Database connection is pre-configured via environment variables.

    Returns:
        List of table names in the database
    """
    try:
        # Use environment variables for connection
        db_conn = get_db_connection_from_env()

        # Get tables
        with db_conn:
            tables = db_conn.get_tables()

        # Format response in standardized JSON structure
        response = {
            "title": "Database Tables",
            "description": f"Found {len(tables)} tables in database '{db_conn.database}'",
            "data": [{"table_name": table} for table in tables]
        }

        return json.dumps(response, indent=2, ensure_ascii=False)

    except ConnectionError as e:
        error_response = {
            "title": "Connection Error",
            "description": "Failed to connect to database",
            "data": [{"error": str(e), "type": "connection_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)
    except Exception as e:
        error_response = {
            "title": "Error Listing Tables",
            "description": "Failed to retrieve table list",
            "data": [{"error": str(e), "type": "execution_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


@mcp.tool()
async def describe_table(
    table_name: str
) -> str:
    """
    Describes the structure of a specific table in the MySQL database.
    Shows column names, data types, nullability, keys, and default values.
    Use this before writing queries to understand the table structure.

    Database connection is pre-configured via environment variables.

    Args:
        table_name: Name of the table to describe

    Returns:
        Table schema information including columns, types, and constraints
    """
    try:
        # Use environment variables for connection
        db_conn = get_db_connection_from_env()

        # Get table schema
        with db_conn:
            schema = db_conn.get_table_schema(table_name)

        # Format schema information
        schema_info = []
        for column in schema:
            col_info = {
                "field": column.get("Field"),
                "type": column.get("Type"),
                "nullable": column.get("Null") == "YES",
                "key": column.get("Key"),
                "default": column.get("Default"),
                "extra": column.get("Extra")
            }
            schema_info.append(col_info)

        # Format response in standardized JSON structure
        response = {
            "title": f"Table Schema: {table_name}",
            "description": f"Table '{table_name}' has {len(schema)} columns",
            "data": schema_info
        }

        return json.dumps(response, indent=2, ensure_ascii=False, default=str)

    except ConnectionError as e:
        error_response = {
            "title": "Connection Error",
            "description": "Failed to connect to database",
            "data": [{"error": str(e), "type": "connection_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)
    except Exception as e:
        error_response = {
            "title": "Error Describing Table",
            "description": f"Failed to retrieve schema for table '{table_name}'",
            "data": [{"error": str(e), "type": "execution_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


@mcp.tool()
async def get_database_schema() -> str:
    """
    Gets the complete database schema including all tables and their columns.
    This provides a comprehensive view of the entire database structure.
    Very useful for understanding the data model before writing complex queries.

    Database connection is pre-configured via environment variables.

    Returns:
        Complete database schema with all tables and their column information
    """
    try:
        # Use environment variables for connection
        db_conn = get_db_connection_from_env()

        # Get full schema
        with db_conn:
            full_schema = db_conn.get_full_schema()

        # Format schema as array of table objects
        schema_data = []
        for table_name, columns in full_schema.items():
            table_info = {
                "table_name": table_name,
                "column_count": len(columns),
                "columns": [
                    {
                        "field": col.get("Field"),
                        "type": col.get("Type"),
                        "nullable": col.get("Null") == "YES",
                        "key": col.get("Key"),
                        "default": col.get("Default"),
                        "extra": col.get("Extra")
                    }
                    for col in columns
                ]
            }
            schema_data.append(table_info)

        # Format response in standardized JSON structure
        response = {
            "title": f"Database Schema: {db_conn.database}",
            "description": f"Complete schema with {len(full_schema)} tables",
            "data": schema_data
        }

        return json.dumps(response, indent=2, ensure_ascii=False, default=str)

    except ConnectionError as e:
        error_response = {
            "title": "Connection Error",
            "description": "Failed to connect to database",
            "data": [{"error": str(e), "type": "connection_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)
    except Exception as e:
        error_response = {
            "title": "Error Getting Schema",
            "description": "Failed to retrieve database schema",
            "data": [{"error": str(e), "type": "execution_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


@mcp.tool()
async def get_company_news(
    company_name: str,
    num_news: int = 5,
    competitors: str = None
) -> str:
    """
    Fetches relevant news for a company using Perplexity AI.

    Can operate in two modes:
    - MOCK mode (default): Returns test data without consuming API credits
    - REAL mode: Makes actual API calls to Perplexity (requires PPLX_API_KEY)

    The tool analyzes external factors that could affect a company, including:
    - Competitor activities
    - Industry regulations and policies
    - Market trends affecting product adoption
    - Technological or ethical risks in the industry

    Args:
        company_name: Name of the company to get news for (e.g., "OpenAI", "Tesla", "Microsoft")
        num_news: Number of news items to return (default: 5, max: 10)
        use_real_api: Set to True to use real Perplexity API (default: False for mock data)
        competitors: Comma-separated list of competitor names (optional, for real API mode)

    Returns:
        JSON formatted string with relevant news items, each containing:
        - title: News headline
        - source: News source and date
        - link: URL to the news article
        - impact: Impact level (Alta amenaza/High threat, Riesgo moderado/Moderate risk, Oportunidad/Opportunity)
        - impact_explanation: Brief explanation of the impact on the company
    """
    import os

    try:
        # Validate num_news
        if num_news < 1:
            return "Error: num_news must be at least 1"
        
        num_news = min(10, num_news)

        api_key = os.getenv("PPLX_API_KEY")
        
        if not api_key:
            return """Error: PPLX_API_KEY not configured.
            To use the real Perplexity API:
            1. Set the PPLX_API_KEY environment variable
            2. Restart the MCP server
            Alternatively, call this tool with use_real_api=False to use mock data."""

        # Parse competitors list
        competitor_list = None
        if competitors:
            competitor_list = [c.strip() for c in competitors.split(',')]

        # Call real Perplexity API
        try:
            news_data = get_real_company_news(
                company_name=company_name,
                competitors=competitor_list,
                num_news=num_news,
                api_key=api_key
            )

            # Format response in standardized JSON structure
            response = {
                "title": f"Company News: {company_name}",
                "description": f"Fetched {len(news_data)} news items from Perplexity API",
                "data": news_data
            }

            return json.dumps(response, indent=2, ensure_ascii=False)

        except ConnectionError as e:
            error_response = {
                "title": "Perplexity API Error",
                "description": f"Failed to connect to Perplexity API: {str(e)}",
                "data": [{"error": str(e), "type": "api_connection_error"}]
            }
            return json.dumps(error_response, indent=2, ensure_ascii=False)

    except Exception as e:
        error_response = {
            "title": "Error Fetching News",
            "description": "Failed to retrieve company news",
            "data": [{"error": str(e), "type": "execution_error"}]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


@mcp.tool()
async def what_if_analysis(
    monto: float,
    fecha: str,
    categoria: str
) -> str:
    """
    Performs ML-based What-If analysis to determine transaction feasibility.

    Uses a trained Random Forest classifier to predict if a proposed financial
    transaction is viable based on historical patterns and cash flow projections.

    Args:
        monto: Transaction amount in MXN (positive number, will be treated as expense)
        fecha: Proposed transaction date in YYYY-MM-DD format (e.g., "2025-03-30")
        categoria: Transaction category, must be one of:
            - "ventas" (sales)
            - "personal" (personnel)
            - "infraestructura" (infrastructure)
            - "costos" (costs)
            - "impuestos" (taxes)

    Returns:
        JSON formatted string with feasibility analysis including:
        - classification: FACTIBLE or NO FACTIBLE
        - probability_feasible: Probability score (0-1)
        - amount_mxn: Transaction amount
        - category: Transaction category
        - proposed_date: Proposed date
        - historical_cash_flow: Accumulated historical cash flow
        - projected_cash_flow: Projected cash flow after transaction
        - minimum_reserve: Required minimum reserve
        - meets_reserve: Boolean indicating if reserve requirement is met
    """
    try:
        # Validate categoria
        valid_categories = ['ventas', 'personal', 'infraestructura', 'costos', 'impuestos']
        if categoria not in valid_categories:
            error_response = {
                "title": "Invalid Category",
                "description": f"Category must be one of: {', '.join(valid_categories)}",
                "data": [{
                    "error": f"Invalid category '{categoria}'",
                    "valid_categories": valid_categories,
                    "type": "validation_error"
                }]
            }
            return json.dumps(error_response, indent=2, ensure_ascii=False)

        # Validate fecha format
        try:
            pd.to_datetime(fecha)
        except Exception as e:
            error_response = {
                "title": "Invalid Date Format",
                "description": "Date must be in YYYY-MM-DD format",
                "data": [{
                    "error": str(e),
                    "provided_date": fecha,
                    "expected_format": "YYYY-MM-DD",
                    "type": "validation_error"
                }]
            }
            return json.dumps(error_response, indent=2, ensure_ascii=False)

        # Run prediction
        result = predict_transaction_feasibility(
            monto=monto,
            fecha=fecha,
            categoria=categoria
        )

        # Format response in standardized JSON structure
        response = {
            "title": "What-If Analysis Results",
            "description": f"Financial feasibility analysis for {categoria} transaction of ${monto:,.2f} MXN on {fecha}",
            "data": [result]
        }

        return json.dumps(response, indent=2, ensure_ascii=False)

    except Exception as e:
        error_response = {
            "title": "Analysis Error",
            "description": "Failed to perform what-if analysis",
            "data": [{
                "error": str(e),
                "type": "execution_error"
            }]
        }
        return json.dumps(error_response, indent=2, ensure_ascii=False)


if __name__ == "__main__":

    import os
    api_key = os.getenv("PPLX_API_KEY")

    # Get transport mode from environment variable
    transport = os.getenv("MCP_TRANSPORT", "sse")  # Default to SSE for Docker

    if transport == "sse":
        # Run with HTTP/SSE transport (better for containers)
        host = os.getenv("MCP_HOST", "0.0.0.0")
        port = int(os.getenv("MCP_PORT", "8000"))

        print(f"Starting MCP server on {host}:{port} with HTTP transport")
        mcp.run(transport="http", host=host, port=port)
    else:
        # Run with stdio transport (for local development)
        print("Starting MCP server with stdio transport")
        mcp.run()
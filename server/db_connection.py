"""
MySQL database connection module.
Handles database connection and query execution.
"""
import mysql.connector
from mysql.connector import Error
from typing import Optional, Dict, List, Any
import os


class MySQLConnection:
    """Class to manage MySQL connections."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 3306,
        database: str = None,
        user: str = None,
        password: str = None
    ):
        """
        Initialize connection parameters.

        Args:
            host: MySQL server host
            port: MySQL server port
            database: Database name
            user: Database user
            password: User password
        """
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self.connection: Optional[mysql.connector.MySQLConnection] = None

    def connect(self) -> bool:
        """
        Establish connection to the database.

        Returns:
            True if connection was successful, False otherwise
        """
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            if self.connection.is_connected():
                return True
            return False
        except Error as e:
            raise ConnectionError(f"Error connecting to MySQL: {e}")

    def disconnect(self) -> None:
        """Close database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def execute_select(self, query: str, params: tuple = None) -> Dict[str, Any]:
        """
        Execute a SELECT query on the database.

        Args:
            query: SELECT SQL query to execute
            params: Query parameters (optional)

        Returns:
            Dictionary with query results and metadata

        Raises:
            ValueError: If query is not a SELECT statement
            ConnectionError: If there are connection issues
            Exception: If there are errors executing the query
        """
        # Validate that it's a SELECT query
        if not query.strip().upper().startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")

        # Connect if not connected
        if not self.connection or not self.connection.is_connected():
            self.connect()

        try:
            cursor = self.connection.cursor(dictionary=True)

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            results = cursor.fetchall()
            column_names = cursor.column_names if cursor.column_names else []
            row_count = cursor.rowcount

            cursor.close()

            return {
                "success": True,
                "data": results,
                "columns": list(column_names),
                "row_count": row_count,
                "query": query
            }

        except Error as e:
            raise Exception(f"Error executing query: {e}")

    def __enter__(self):
        """Allow using the class with context manager."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Close connection when exiting context manager."""
        self.disconnect()

    def get_tables(self) -> List[str]:
        """
        Get list of all tables in the database.

        Returns:
            List of table names
        """
        if not self.connection or not self.connection.is_connected():
            self.connect()

        try:
            cursor = self.connection.cursor()
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            cursor.close()
            return tables
        except Error as e:
            raise Exception(f"Error fetching tables: {e}")

    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get schema information for a specific table.

        Args:
            table_name: Name of the table

        Returns:
            List of column information dictionaries
        """
        if not self.connection or not self.connection.is_connected():
            self.connect()

        try:
            cursor = self.connection.cursor(dictionary=True)

            # Get column information
            cursor.execute(f"DESCRIBE `{table_name}`")
            columns = cursor.fetchall()

            cursor.close()
            return columns
        except Error as e:
            raise Exception(f"Error fetching schema for table {table_name}: {e}")

    def get_full_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get complete database schema with all tables and their columns.

        Returns:
            Dictionary mapping table names to their column information
        """
        tables = self.get_tables()
        schema = {}

        for table in tables:
            schema[table] = self.get_table_schema(table)

        return schema


def get_db_connection_from_env() -> MySQLConnection:
    """
    Create a MySQLConnection instance using environment variables.

    Expected environment variables:
        - MYSQL_HOST (default: localhost)
        - MYSQL_PORT (default: 3306)
        - MYSQL_DATABASE
        - MYSQL_USER
        - MYSQL_PASSWORD

    Returns:
        Configured MySQLConnection instance
    """
    return MySQLConnection(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        database=os.getenv("MYSQL_DATABASE"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD")
    )

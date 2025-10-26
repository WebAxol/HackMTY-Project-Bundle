# Database Initialization and Mock Data

This directory contains scripts and configurations for initializing the MySQL database with mock data.

## Overview

The database initialization system provides:
- **Automated schema creation** with 9 related tables
- **Mock data generation** using Faker library
- **Financial data simulation** with realistic business transactions
- **Docker integration** for seamless deployment

## Architecture

```
database/
├── Dockerfile              # Container for running mockData.py
├── requirements.txt        # Python dependencies (faker, mysql-connector)
├── mockData.py            # Main script for data generation
├── init.sql               # Optional SQL initialization script
└── README.md              # This file
```

## Database Schema

The mock data system creates the following tables:

### 1. **Department**
- Organizational departments (Marketing, Finanzas, etc.)

### 2. **Company**
- Company information (single row: TechSolutions S.A.)

### 3. **Person**
- Customer and employee personal information
- Default: 100 people

### 4. **Employee**
- Employee records linked to Person
- Default: 20 employees
- Includes position, salary, hire date, department

### 5. **Supplier**
- Product suppliers
- Default: 10 suppliers

### 6. **Product**
- Product catalog with prices and stock
- Default: 50 products
- Linked to suppliers

### 7. **Sale**
- Sales transactions
- Default: 10,000 sales
- Linked to customers (Person)

### 8. **SaleDetail**
- Individual items in each sale
- Links Sale to Product with quantities and prices

### 9. **Expense**
- Company expenses by department
- Default: 200 expenses
- Balanced to ensure positive profit

## Mock Data Configuration

Configure the amount of data generated in `mockData.py`:

```python
NUM_PEOPLE = 100         # Total people (customers + potential employees)
NUM_EMPLOYEES = 20       # Employees (subset of people)
NUM_PRODUCTS = 50        # Products in catalog
NUM_SUPPLIERS = 10       # Product suppliers
NUM_SALES = 10000        # Sales transactions
NUM_EXPENSES = 200       # Company expenses
COMPANY_START_FUNDS = 5000000.00  # Initial capital
```

## Usage

### Option 1: Using Docker Compose (Recommended)

#### Initialize Database with Mock Data

```bash
# Start MySQL and initialize with mock data
docker compose --profile seed up -d

# View initialization logs
docker logs -f liquid-db-seed
```

The `--profile seed` flag runs the `db-seed` service which:
1. Waits for MySQL to be healthy
2. Drops existing tables
3. Creates schema
4. Inserts mock data
5. Exits automatically

#### Start Services WITHOUT Mock Data

```bash
# Start only MySQL (empty database)
docker compose up -d mysql

# Or start all services except seed
docker compose up -d
```

### Option 2: Manual Execution

#### Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=test_db
export MYSQL_USER=test_user
export MYSQL_PASSWORD=test_password

# Run the script
python mockData.py
```

#### Run in Docker (standalone)

```bash
# Build the seed container
docker build -t liquid-db-seed ./database

# Run the container
docker run --rm \
  --network liquid-network \
  -e MYSQL_HOST=mysql \
  -e MYSQL_PORT=3306 \
  -e MYSQL_DATABASE=test_db \
  -e MYSQL_USER=test_user \
  -e MYSQL_PASSWORD=test_password \
  liquid-db-seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL server hostname | `localhost` |
| `MYSQL_PORT` | MySQL server port | `3306` |
| `MYSQL_DATABASE` | Database name | `test_db` |
| `MYSQL_USER` | Database user | `test_user` |
| `MYSQL_PASSWORD` | Database password | `test_password` |

## Features

### 1. **Smart MySQL Waiting**

The script includes a retry mechanism that waits for MySQL to be ready:

```python
def wait_for_mysql(max_retries=30, retry_interval=2):
    """Wait for MySQL to be ready to accept connections."""
```

- Max retries: 30 (60 seconds total)
- Retry interval: 2 seconds
- Graceful failure with error messages

### 2. **Realistic Financial Data**

The script generates realistic financial scenarios:

```python
# Ensures profit is within target range
MIN_PROFIT = 20000.00
MAX_PROFIT = 50000.00
target_net_profit = random.uniform(MIN_PROFIT, MAX_PROFIT)
```

**Financial Summary Output:**
```
--- Financial Summary ---
Total Revenue (Ventas): $X,XXX,XXX.XX
Total Expenses (Gastos): $X,XXX,XXX.XX
Net Profit (Beneficio Neto): $XX,XXX.XX
Target Profit Range: $20,000.00 - $50,000.00
```

### 3. **Data Relationships**

- Employees are a subset of People
- Sales link to People (customers or employees)
- Products linked to Suppliers
- Expenses linked to Departments
- SaleDetail provides many-to-many between Sales and Products

### 4. **Spanish Localization**

Uses Faker's Spanish locale:

```python
fake = Faker("es_ES")
```

Generates realistic Spanish names, addresses, and phone numbers.

## Generated Data Samples

### Person
```
ID: 1
Name: María García López
Email: maria.garcia1@mockcorp.com
Phone: +34 912 345 678
Address: Calle Mayor 123, Madrid
```

### Product
```
ID: 1
Name: Laptop 1
Description: Producto de alta calidad...
Price: $1,250.00
Stock: 150
Supplier ID: 3
```

### Sale
```
ID: 1
Date: 2024-10-15
Total: $3,750.00
Customer ID: 45
```

## Troubleshooting

### Connection Issues

**Error:** `Error connecting to MySQL`

**Solution:**
1. Verify MySQL is running:
   ```bash
   docker ps | grep mysql
   ```
2. Check environment variables:
   ```bash
   docker exec liquid-db-seed env | grep MYSQL
   ```
3. Verify network connectivity:
   ```bash
   docker exec liquid-db-seed ping mysql
   ```

### Permissions Issues

**Error:** `Access denied for user`

**Solution:**
Ensure credentials match `.env` file:
```bash
MYSQL_USER=test_user
MYSQL_PASSWORD=test_password
```

### Data Already Exists

The script automatically drops existing tables:

```python
for table in ['SaleDetail', 'Sale', 'Expense', ...]:
    cursor.execute(f"DROP TABLE IF EXISTS {table}")
```

To preserve data, comment out the DROP statements.

## Customization

### Modify Data Amounts

Edit `mockData.py`:

```python
# Generate more sales
NUM_SALES = 50000

# Generate more products
NUM_PRODUCTS = 200

# Add more employees
NUM_EMPLOYEES = 50
```

### Add New Departments

```python
DEPARTMENTS = [
    "Marketing",
    "Finanzas",
    "Recursos Humanos",
    "Soporte Técnico",
    "Atención al Cliente",
    "Innovación",
    "Gerencia",
    "Ventas",          # New
    "Logística"        # New
]
```

### Adjust Profit Margins

```python
# Tighter profit margins
MIN_PROFIT = 10000.00
MAX_PROFIT = 30000.00

# Or higher profits
MIN_PROFIT = 50000.00
MAX_PROFIT = 100000.00
```

## Re-initializing Database

### Complete Reset

```bash
# Stop all services
docker compose down

# Remove database volume
docker volume rm liquid_mysql_data

# Start with seed
docker compose --profile seed up -d
```

### Refresh Data Only

```bash
# Run seed container again
docker compose run --rm db-seed
```

## Verification

### Check Tables

```bash
docker exec -it liquid-mysql mysql -u test_user -ptest_password test_db -e "SHOW TABLES;"
```

### Check Record Counts

```bash
docker exec -it liquid-mysql mysql -u test_user -ptest_password test_db -e "
SELECT
  'Person' as TableName, COUNT(*) as Count FROM Person
  UNION ALL
  SELECT 'Employee', COUNT(*) FROM Employee
  UNION ALL
  SELECT 'Product', COUNT(*) FROM Product
  UNION ALL
  SELECT 'Sale', COUNT(*) FROM Sale;
"
```

### View Sample Data

```bash
docker exec -it liquid-mysql mysql -u test_user -ptest_password test_db -e "
SELECT * FROM Person LIMIT 5;
"
```

## Production Considerations

### Security

- [ ] Use strong passwords (not defaults)
- [ ] Restrict database user permissions
- [ ] Don't expose MySQL port publicly
- [ ] Use secrets management (not .env files)

### Performance

- [ ] Reduce data amounts for dev environments
- [ ] Use production-grade data for staging
- [ ] Consider batching inserts for large datasets
- [ ] Add indexes after data load

### Data Quality

- [ ] Validate referential integrity
- [ ] Check for duplicate records
- [ ] Verify financial calculations
- [ ] Test with realistic data volumes

## Script Output

Successful execution looks like:

```
============================================================
Starting MySQL Database Initialization
============================================================

--- Waiting for MySQL at mysql:3306 ---
Attempt 1/30... ✗ Not ready yet (Error: 2003)
Attempt 2/30... ✗ Not ready yet (Error: 2003)
Attempt 3/30... ✓ MySQL is ready!

--- Starting mock data generation ---

--- Generating Department Data ---
--- Generating Company Data ---
--- Generating Person Data ---
--- Generating Employee Data ---
--- Generating Supplier Data ---
--- Generating Product Data ---
--- Generating 10000 Sales and Details ---
--- Generating 200 Expenses ---

--- Financial Summary ---
Total Revenue (Ventas): $4,567,890.50
Total Expenses (Gastos): $4,535,234.12
Net Profit (Beneficio Neto): $32,656.38
Target Profit Range: $20,000.00 - $50,000.00
Resultado en Rango Estrecho: True

--- Inserting data into MySQL ---
--- Connecting to MySQL... ---
--- Creating/Dropping Tables ---
Tables created successfully.
Inserted 7 rows into Department.
Inserted 1 rows into Company.
Inserted 100 rows into Person.
Inserted 20 rows into Employee.
Inserted 10 rows into Supplier.
Inserted 50 rows into Product.
Inserted 200 rows into Expense.
Inserted 10000 rows into Sale.
Inserted 25678 rows into SaleDetail.
--- MySQL connection closed. ---

============================================================
🎉 All mock data inserted successfully!
============================================================
```

## Dependencies

- **Python 3.11+**
- **faker** (22.0.0): Generate fake data
- **mysql-connector-python** (8.3.0): MySQL database connector

## License

See main project LICENSE file.

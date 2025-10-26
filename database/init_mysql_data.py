import csv
from faker import Faker
import random
from datetime import date, timedelta
import os
import mysql.connector
import time
import sys

# --- Configuration for MySQL Connection ---
MYSQL_CONFIG = {
    'user': os.getenv("MYSQL_USER"),
    'password': os.getenv("MYSQL_PASSWORD"),
    'host': os.getenv("MYSQL_HOST", "mysql"),
    'port': int(os.getenv("MYSQL_PORT", "3306")),
    'database': os.getenv("MYSQL_DATABASE", "test_db")
}

# --- Configuration for Mock Data ---
NUM_PEOPLE = 100
NUM_EMPLOYEES = 20
NUM_PRODUCTS = 50
NUM_SUPPLIERS = 10
NUM_SALES = 10000
NUM_EXPENSES = 200
DEPARTMENTS = [
    "Marketing",
    "Finanzas",
    "Recursos Humanos",
    "Soporte Técnico",
    "Atención al Cliente",
    "Innovación",
    "Gerencia",
]
COMPANY_START_FUNDS = 5000000.00  

fake = Faker("es_ES") 
current_date = date.today()


def generate_email(first, last, index):
    return f"{first.lower()}.{last.lower()}{index}@mockcorp.com"

def wait_for_mysql(max_retries=30, retry_interval=2):
    """Wait for MySQL to be ready to accept connections."""
    print(f"\n--- Waiting for MySQL at {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']} ---")

    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempt {attempt}/{max_retries}...", end=" ")

            # Try to connect
            cnx = mysql.connector.connect(**MYSQL_CONFIG)
            cursor = cnx.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()  # Consume the result to avoid "Unread result found" error
            cursor.close()
            cnx.close()

            print("✓ MySQL is ready!")
            return True

        except mysql.connector.Error as err:
            print(f"✗ Not ready yet (Error: {err.errno})")

            if attempt < max_retries:
                time.sleep(retry_interval)
            else:
                print(f"\n❌ Failed to connect to MySQL after {max_retries} attempts.")
                print(f"Error: {err}")
                sys.exit(1)

    return False

# --- 1. MySQL Schema Definition (SQL) ---
def get_mysql_schema():
    return [
        """
        CREATE TABLE IF NOT EXISTS Department (
            id INT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Company (
            id INT PRIMARY KEY,
            type VARCHAR(50),
            name VARCHAR(100) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(100)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Person (
            id INT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(20),
            address VARCHAR(255)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Employee (
            id INT PRIMARY KEY,
            person_id INT UNIQUE NOT NULL,
            position VARCHAR(50),
            hire_date DATE,
            department_id INT,
            salary DECIMAL(10, 2),
            FOREIGN KEY (person_id) REFERENCES Person(id),
            FOREIGN KEY (department_id) REFERENCES Department(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Supplier (
            id INT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            contact VARCHAR(100),
            phone VARCHAR(20),
            email VARCHAR(100)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Product (
            id INT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2),
            stock INT,
            supplier_id INT,
            FOREIGN KEY (supplier_id) REFERENCES Supplier(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Sale (
            id INT PRIMARY KEY,
            date DATE NOT NULL,
            sale_total DECIMAL(10, 2),
            person_id INT,
            FOREIGN KEY (person_id) REFERENCES Person(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS SaleDetail (
            id INT PRIMARY KEY,
            sale_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT,
            unit_price DECIMAL(10, 2),
            FOREIGN KEY (sale_id) REFERENCES Sale(id),
            FOREIGN KEY (product_id) REFERENCES Product(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS Expense (
            id INT PRIMARY KEY,
            date DATE NOT NULL,
            amount DECIMAL(10, 2),
            expense_type VARCHAR(100),
            department_id INT,
            FOREIGN KEY (department_id) REFERENCES Department(id)
        );
        """,
    ]

def generate_mock_data():
    
    data = {}
    
    department_ids = []
    person_ids = []
    employee_person_ids = set()
    supplier_ids = []
    product_ids = []
    
    
    # -----------------------------------------------------
    # 1. Department
    # -----------------------------------------------------
    print("\n--- Generating Department Data ---")
    departments_data = []
    for i, name in enumerate(DEPARTMENTS, 1):
        departments_data.append([i, name])
        department_ids.append(i)
    data['Department'] = departments_data
    
    # -----------------------------------------------------
    # 2. Company (1 row)
    # -----------------------------------------------------
    print("--- Generating Company Data ---")
    company_name = "TechSolutions S.A."
    company_data = [
        [
            1,
            "Tecnología", 
            company_name, 
            fake.address(), 
            fake.phone_number(), 
            f"contacto@{company_name.lower().replace(' ', '')}.com"
        ]
    ]
    data['Company'] = company_data
    
    # -----------------------------------------------------
    # 3. Person
    # -----------------------------------------------------
    print("--- Generating Person Data ---")
    persons_data = []
    for i in range(1, NUM_PEOPLE + 1):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = generate_email(first_name, last_name, i)
        persons_data.append([
            i, 
            first_name, 
            last_name, 
            email, 
            fake.phone_number(), 
            fake.address()
        ])
        person_ids.append(i)
    data['Person'] = persons_data

    # -----------------------------------------------------
    # 4. Employee
    # -----------------------------------------------------
    print("--- Generating Employee Data ---")
    employees_data = []
    employee_person_ids_list = random.sample(person_ids, NUM_EMPLOYEES)
    employee_person_ids.update(employee_person_ids_list)
    
    positions = ["Analista", "Especialista", "Gerente", "Técnico", "Asistente"]
    
    for i, person_id in enumerate(employee_person_ids_list, 1):
        position = random.choice(positions)
        hire_date = fake.date_between(start_date='-5y', end_date='today')
        department_id = random.choice(department_ids)
        salary = round(random.uniform(25000.00, 80000.00) if position != 'Gerente' else random.uniform(80000.00, 150000.00), 2)
        
        employees_data.append([
            i,
            person_id, 
            position, 
            hire_date, 
            department_id, 
            salary
        ])
    data['Employee'] = employees_data
    
    # -----------------------------------------------------
    # 5. Supplier
    # -----------------------------------------------------
    print("--- Generating Supplier Data ---")
    suppliers_data = []
    for i in range(1, NUM_SUPPLIERS + 1):
        supplier_name = fake.company()
        suppliers_data.append([
            i, 
            supplier_name, 
            fake.name(), 
            fake.phone_number(), 
            fake.email()
        ])
        supplier_ids.append(i)
    data['Supplier'] = suppliers_data

    # -----------------------------------------------------
    # 6. Product
    # -----------------------------------------------------
    print("--- Generating Product Data ---")
    products_data = []
    product_names = ["Laptop", "Monitor 4K", "Teclado Mecánico", "Mouse Inalámbrico", "Webcam HD", "Software de Gestión", "Servidor Cloud", "Licencia Antivirus"]
    for i in range(1, NUM_PRODUCTS + 1):
        name = random.choice(product_names) + f" {i}"
        price = round(random.uniform(50.00, 1500.00), 2)
        stock = random.randint(10, 200)
        supplier_id = random.choice(supplier_ids)
        
        products_data.append([
            i, 
            name, 
            fake.text(max_nb_chars=100).replace('\n', ' '),
            price, 
            stock, 
            supplier_id
        ])
        product_ids.append(i)
    data['Product'] = products_data

    # -----------------------------------------------------
    # 7. Sale and SaleDetail
    # -----------------------------------------------------
    print(f"--- Generating {NUM_SALES} Sales and Details ---")
    sales_data = []
    sale_details_data = []
    total_revenue = 0.0
    sale_detail_id = 1
    
    customer_person_ids = [pid for pid in person_ids if pid not in employee_person_ids]
    
    for i in range(1, NUM_SALES + 1):
        sale_date = current_date - timedelta(days=random.randint(1, 365))
        customer_id = random.choice(customer_person_ids + employee_person_ids_list)
        
        sale_total = 0.0
        products_in_sale = random.sample(product_ids, random.randint(1, 5))
        
        for product_id in products_in_sale:
            quantity = random.randint(1, 3)
            product_info = next(p for p in products_data if p[0] == product_id)
            unit_price = product_info[3]
            
            sale_details_data.append([
                sale_detail_id, 
                i,
                product_id, 
                quantity, 
                unit_price
            ])
            sale_total += quantity * unit_price
            sale_detail_id += 1
            
        sales_data.append([
            i,
            sale_date, 
            round(sale_total, 2), 
            customer_id
        ])
        total_revenue += sale_total
        
    data['Sale'] = sales_data
    data['SaleDetail'] = sale_details_data

    # -----------------------------------------------------
    # 8. Expense
    # -----------------------------------------------------
    print(f"--- Generating {NUM_EXPENSES} Expenses ---")
    expenses_data = []
    total_expenses = 0.0
    
    MIN_PROFIT = 20000.00
    MAX_PROFIT = 50000.00
    target_net_profit = random.uniform(MIN_PROFIT, MAX_PROFIT)
    
    max_expense_limit = total_revenue - target_net_profit 
    
    if max_expense_limit <= 0 or max_expense_limit >= total_revenue:
        max_expense_limit = total_revenue * 0.95
        print(f"Warning: Ingresos demasiado bajos. Ajustando el límite de gasto a ${max_expense_limit:,.2f}")
    
    expense_types = ["Suministros de Oficina", "Marketing Digital", "Viajes y Viáticos", "Servicios Públicos", "Software y Licencias", "Mantenimiento"]
    
    for i in range(1, NUM_EXPENSES + 1):
        expense_date = current_date - timedelta(days=random.randint(1, 365))
        expense_type = random.choice(expense_types)
        department_id = random.choice(department_ids)
        
        remaining_budget = max_expense_limit - total_expenses
        remaining_expenses_count = NUM_EXPENSES - i + 1
        
        if remaining_budget <= 0:
            amount = round(random.uniform(1.00, 10.00), 2) 
        else:
            max_possible_amount = remaining_budget * 0.9 / remaining_expenses_count
            max_limit_for_single_expense = min(50000.00, max_possible_amount)

            amount = round(random.uniform(100.00, max_limit_for_single_expense), 2)
            
        
        expenses_data.append([
            i, 
            expense_date, 
            amount, 
            expense_type, 
            department_id
        ])
        total_expenses += amount
        
    data['Expense'] = expenses_data

    net_profit = total_revenue - total_expenses
    current_funds = COMPANY_START_FUNDS + net_profit
    
    print("\n--- Financial Summary ---")
    print(f"Total Revenue (Ventas): ${total_revenue:,.2f}")
    print(f"Total Expenses (Gastos): ${total_expenses:,.2f}")
    print(f"Net Profit (Beneficio Neto): ${net_profit:,.2f}")
    print(f"Target Profit Range: ${MIN_PROFIT:,.2f} - ${MAX_PROFIT:,.2f}")
    
    is_tight = MIN_PROFIT <= net_profit <= MAX_PROFIT
    print(f"Resultado en Rango Estrecho: {is_tight} (Diferencia entre ${MIN_PROFIT:,.2f} y ${MAX_PROFIT:,.2f})")
    
    print(f"Compañía Fondos Actuales (Inicial + Neto): ${current_funds:,.2f} (Nunca Negativo: {current_funds >= COMPANY_START_FUNDS})")
    
    return data

def create_and_insert_data(mock_data):
    try:
        print("\n--- Connecting to MySQL... ---")
        cnx = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = cnx.cursor()
        
        print("--- Creating/Dropping Tables ---")
        for table in ['SaleDetail', 'Sale', 'Expense', 'Product', 'Supplier', 'Employee', 'Person', 'Company', 'Department']:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
            except mysql.connector.Error as err:
                pass 
                
        for command in get_mysql_schema():
            cursor.execute(command)
            
        print("Tables created successfully.")

        insertion_order = [
            ('Department', "INSERT INTO Department (id, name) VALUES (%s, %s)"),
            ('Company', "INSERT INTO Company (id, type, name, address, phone, email) VALUES (%s, %s, %s, %s, %s, %s)"),
            ('Person', "INSERT INTO Person (id, first_name, last_name, email, phone, address) VALUES (%s, %s, %s, %s, %s, %s)"),
            ('Employee', "INSERT INTO Employee (id, person_id, position, hire_date, department_id, salary) VALUES (%s, %s, %s, %s, %s, %s)"),
            ('Supplier', "INSERT INTO Supplier (id, name, contact, phone, email) VALUES (%s, %s, %s, %s, %s)"),
            ('Product', "INSERT INTO Product (id, name, description, price, stock, supplier_id) VALUES (%s, %s, %s, %s, %s, %s)"),
            ('Expense', "INSERT INTO Expense (id, date, amount, expense_type, department_id) VALUES (%s, %s, %s, %s, %s)"),
            ('Sale', "INSERT INTO Sale (id, date, sale_total, person_id) VALUES (%s, %s, %s, %s)"),
            ('SaleDetail', "INSERT INTO SaleDetail (id, sale_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s, %s)")
        ]

        for table_name, insert_query in insertion_order:
            data_to_insert = mock_data.get(table_name, [])
            if data_to_insert:
                cursor.executemany(insert_query, data_to_insert)
                print(f"Inserted {len(data_to_insert)} rows into {table_name}.")
            else:
                print(f"No data to insert for {table_name}.")

        cnx.commit()
        cursor.close()
        cnx.close()
        print("--- MySQL connection closed. ---")
        
    except mysql.connector.Error as err:
        print(f"\n Error connecting to or interacting with MySQL:")
        print(f"Error Code: {err.errno}")
        print(f"SQLSTATE: {err.sqlstate}")
        print(f"Message: {err.msg}")
        print("\n*Please check your MYSQL_CONFIG and ensure the database exists.*")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("Starting MySQL Database Initialization")
    print("=" * 60)

    # Wait for MySQL to be ready
    wait_for_mysql()

    print("\n--- Starting mock data generation ---")
    generated_data = generate_mock_data()

    print("\n--- Inserting data into MySQL ---")
    create_and_insert_data(generated_data)

    print("\n" + "=" * 60)
    print("🎉 All mock data inserted successfully!")
    print("=" * 60)
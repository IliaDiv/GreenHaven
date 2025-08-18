from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
import mysql.connector
from mysql.connector import Error
import os
import sys
import socket
import boto3
import json
from botocore.exceptions import ClientError

def get_rds_endpoint_boto3():
    """Get RDS endpoint using boto3"""
    rds_client = boto3.client('rds')
    response = rds_client.describe_db_instances(
        DBInstanceIdentifier='myapp-database'
    )
    return response['DBInstances'][0]['Endpoint']['Address']

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', '1231212412')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 30 

DB_HOST = os.getenv('DB_HOST', 'localhost')

def get_connection():
    """Get database connection with error handling"""
    try:
        rds_client = boto3.client('rds')
        db_hostname = get_rds_endpoint_boto3()
        token = rds_client.generate_db_auth_token(
            DBHostname=db_hostname,  # ✅ Works perfectly
            Port=3306,
            DBUsername='iam-user'
        )
        connection = pymysql.connect(
        host=db_hostname,
        user='iam-user',
        password=token,
        database='users',
        port=3306,
        ssl={'ssl_ca': '/opt/amazon-cert.pem'},
        connect_timeout=10
        )
        
        print("Database connection successful")
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def init_db():
    """Initialize database and create tables"""
    if DB_HOST == 'localhost':
        return
    try:
        # First, connect without database to create it if needed
        print("Initializing database...")
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=3306
        )
        print("Connected...")
        cur = conn.cursor()
        
        # Create database if it doesn't exist
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"Database {DB_NAME} created or already exists")
        
        conn.commit()
        conn.close()
        
        # Now connect to the database and create tables
        conn = get_connection()
        if conn:
            cur = conn.cursor()
            
            # Drop and recreate table for testing (remove this in production)
            # cur.execute("DROP TABLE IF EXISTS users")
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    first_name VARCHAR(80) NOT NULL,
                    last_name VARCHAR(80) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    newsletter BOOLEAN DEFAULT FALSE
                )
            """)
            print("Users table created or already exists")
            
            # Check if table is empty and add a test user
            cur.execute("SELECT COUNT(*) FROM users")
            count = cur.fetchone()[0]
            print(f"Current user count: {count}")
            
            if count == 0:
                # Add a test user for debugging
                test_password = generate_password_hash("password123")
                cur.execute("""
                    INSERT INTO users (email, first_name, last_name, password, newsletter)
                    VALUES (%s, %s, %s, %s, %s)
                """, ("test@example.com", "Test", "User", test_password, False))
                print("Test user created: test@example.com / password123")
            
            conn.commit()
            conn.close()
            print("Database initialization complete")
        else:
            print("Failed to connect to database for table creation")
            
    except Error as e:
        print(f"Database initialization error: {e}")
        sys.exit(1)


@app.route("/")
def index():
    return render_template("index.html")


@app.route('/signup.html')
def signup():
    return render_template('signup.html')


@app.route('/register', methods=['POST'])
def register():
    try:
        print("\n=== REGISTRATION ATTEMPT ===")
        
        # Get form data
        email = request.form.get('email')
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        password = request.form.get('password')
        newsletter = request.form.get('newsletter') == 'on'
        
        print(f"Registration for: {email}")
        
        # Validate required fields
        if not all([email, first_name, last_name, password]):
            print("Missing required fields")
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        # Hash the password
        hashed_password = generate_password_hash(password)
        
        # Connect to database
        conn = get_connection()
        if not conn:
            print("Database connection failed")
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor()
        
        # Check if email already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            print(f"Email already registered: {email}")
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # Insert new user
        cur.execute("""
            INSERT INTO users (email, first_name, last_name, password, newsletter)
            VALUES (%s, %s, %s, %s, %s)
        """, (email, first_name, last_name, hashed_password, newsletter))
        
        conn.commit()
        print(f"User registered successfully: {email}")
        conn.close()
        
        # Return appropriate response
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': True,
                'message': 'Registration successful',
                'redirect': url_for('login')
            })
        else:
            return redirect(url_for('login'))
            
    except Error as e:
        print(f"Database error during registration: {e}")
        return jsonify({
            'success': False,
            'message': f'Database error: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500


@app.route('/login.html', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    if request.method == 'POST':
        try:
            print("\n=== LOGIN ATTEMPT ===")
            
            # Get form data
            email = request.form.get('email')
            password = request.form.get('password')
            
            print(f"Login attempt for: {email}")
            
            # Validate input
            if not email or not password:
                print("Missing email or password")
                return jsonify({
                    'success': False,
                    'message': 'Email and password are required'
                }), 400
            
            # Connect to database
            conn = get_connection()
            if not conn:
                print("Database connection failed")
                return jsonify({
                    'success': False,
                    'message': 'Database connection failed'
                }), 500
            
            cur = conn.cursor()
            
            # Query user from database
            print(f"Querying database for user: {email}")
            cur.execute("""
                SELECT id, email, first_name, last_name, password 
                FROM users 
                WHERE email = %s
            """, (email,))
            
            user = cur.fetchone()
            conn.close()
            
            if user:
                user_id, user_email, first_name, last_name, stored_password = user
                print(f"User found: {user_email}")
                
                # Verify password
                if check_password_hash(stored_password, password):
                    print(f"Password correct for user: {email}")
                    
                    # Store user in session - mark as permanent
                    session.permanent = True
                    session['user_id'] = user_id
                    session['user_email'] = user_email
                    session['user_name'] = f"{first_name} {last_name}"
                    session['first_name'] = first_name
                    session['last_name'] = last_name
                    
                    user_data = {
                        'id': user_id,
                        'email': user_email,
                        'firstName': first_name,
                        'lastName': last_name
                    }
                    
                    # Return appropriate response
                    accept_header = request.headers.get('Accept', '')
                    content_type = request.headers.get('Content-Type', '')
                    
                    if 'application/json' in accept_header or 'application/json' in content_type:
                        return jsonify({
                            'success': True,
                            'message': 'Login successful',
                            'user': user_data,
                            'redirect': url_for('index')
                        })
                    else:
                        # For regular form submission
                        return redirect(url_for('index'))
                else:
                    print(f"Invalid password for user: {email}")
                    error_message = "Invalid email or password"
            else:
                print(f"User not found: {email}")
                error_message = "Invalid email or password"
            
            # Login failed
            accept_header = request.headers.get('Accept', '')
            content_type = request.headers.get('Content-Type', '')
            
            if 'application/json' in accept_header or 'application/json' in content_type:
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 401
            else:
                # For regular form submission, render login page with error
                return render_template('login.html', error=error_message)
                
        except Error as e:
            print(f"Database error during login: {e}")
            return jsonify({
                'success': False,
                'message': f'Database error: {str(e)}'
            }), 500
        except Exception as e:
            print(f"Login error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': 'An error occurred during login'
            }), 500


@app.route('/logout', methods=['GET', 'POST'])
def logout():
    """Handle logout"""
    session.clear()
    
    if request.method == 'POST':
        # For AJAX requests
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    else:
        # For regular requests
        return redirect(url_for('index'))


@app.route('/api/check-session')
def check_session():
    """Check if user is logged in and return user data"""
    if 'user_id' in session:
        print("---------------")
        print("User connected!")
        print("---------------")
        return jsonify({
            'logged_in': True,
            'user': {
                'id': session.get('user_id'),
                'email': session.get('user_email'),
                'firstName': session.get('user_name', '').split(' ')[0] if session.get('user_name') else '',
                'lastName': session.get('user_name', '').split(' ')[1] if session.get('user_name') and len(session.get('user_name', '').split(' ')) > 1 else ''
            }
        })
    else:
        return jsonify({
            'logged_in': False,
            'user': None
        })
    
SERVER_ID = os.getenv('SERVER_ID', 'unknown')
HOSTNAME = socket.gethostname()

@app.route('/health')
def health_check():
    """Health check endpoint for load balancer"""
    try:
        # Test database connection
        conn = get_connection()
        if conn:
            conn.close()
            db_status = "healthy"
        else:
            db_status = "unhealthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'server_id': SERVER_ID,
        'hostname': HOSTNAME,
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/server-info')
def server_info():
    """Show which server is responding"""
    return jsonify({
        'server_id': SERVER_ID,
        'hostname': HOSTNAME,
        'ip': request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
    })


@app.route('/test-db')
def test_db():
    """Test database connection and show users"""
    try:
        conn = get_connection()
        if not conn:
            return "Database connection failed", 500
        
        cur = conn.cursor()
        cur.execute("SELECT id, email, first_name, last_name FROM users")
        users = cur.fetchall()
        conn.close()
        
        result = "<h1>Database Test</h1>"
        result += f"<p>Connected to database: {DB_NAME}</p>"
        result += f"<h2>Users in database:</h2>"
        result += "<ul>"
        for user in users:
            result += f"<li>ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}</li>"
        result += "</ul>"
        result += "<p>Test user: test@example.com / password123</p>"
        
        return result
        
    except Exception as e:
        return f"Error: {str(e)}", 500


@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        conn = get_connection()
        if not conn:
            return jsonify([]), 500
            
        cur = conn.cursor()
        cur.execute("SELECT id, first_name, last_name FROM users")
        items = cur.fetchall()
        conn.close()
        
        items_list = []
        for item in items:
            items_list.append({
                'id': item[0],
                'first_name': item[1],
                'last_name': item[2]
            })
        
        return jsonify(items_list)
    except Exception as e:
        print(f"Error fetching items: {str(e)}")
        return jsonify([]), 500


if __name__ == "__main__":
    print("\n=== Starting Flask Application ===")
    print(f"Database User: {DB_USER}")
    print(f"Database Name: {DB_NAME}")
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)

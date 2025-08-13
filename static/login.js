// Login Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Login attempt for:', email);
            
            // Clear previous errors
            clearErrors();
            
            // Basic validation
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            // Validate email format
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitButton.disabled = true;
            
            // Prepare form data
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            
            // Send login request with proper headers
            fetch('/login.html', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'  // Tell server we want JSON response
                },
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers.get('content-type'));
                
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(data => ({
                        status: response.status,
                        data: data
                    }));
                } else if (response.redirected) {
                    // Handle redirect (successful login)
                    window.location.href = response.url;
                    return null;
                } else {
                    // Non-JSON response
                    return response.text().then(text => {
                        console.error('Non-JSON response:', text);
                        throw new Error('Invalid server response');
                    });
                }
            })
            .then(result => {
                if (!result) return; // Handled redirect
                
                console.log('Login response:', result);
                
                if (result.status === 200 && result.data.success) {
                    // Login successful
                    console.log('Login successful:', result.data.user);
                    
                    // Store user data using the header-auth function
                    if (result.data.user && typeof setUserLoggedIn === 'function') {
                        setUserLoggedIn(result.data.user);
                    } else if (result.data.user) {
                        // Fallback if header-auth.js isn't loaded
                        localStorage.setItem('user', JSON.stringify(result.data.user));
                        localStorage.setItem('isLoggedIn', 'true');
                    }
                    
                    // Show success message
                    showSuccessDiv('Welcome back! Redirecting...');
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = result.data.redirect || '/';
                    }, 1500);
                    
                } else {
                    // Login failed
                    console.log('Login failed:', result.data.message);
                    showErrorDiv(result.data.message || 'Invalid email or password. Please try again.');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showErrorDiv('An error occurred during login. Please check your connection and try again.');
            })
            .finally(() => {
                // Reset button state
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            });
        });
    }
});

function showError(message) {
    // Use the messages container
    const messagesContainer = document.getElementById('loginMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
        messagesContainer.style.display = 'block';
    }
}

function showErrorDiv(message) {
    // Use the existing error div
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        const errorText = errorDiv.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
        errorDiv.style.display = 'block';
    }
    
    // Hide success div
    const successDiv = document.getElementById('loginSuccess');
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    // Also show in messages container
    const messagesContainer = document.getElementById('loginMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
        messagesContainer.style.display = 'block';
    }
}

function showSuccessDiv(message) {
    // Use the existing success div
    const successDiv = document.getElementById('loginSuccess');
    if (successDiv) {
        const successText = successDiv.querySelector('p');
        if (successText) {
            successText.textContent = message;
        }
        successDiv.style.display = 'block';
    }
    
    // Hide error div
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Clear messages container
    const messagesContainer = document.getElementById('loginMessages');
    if (messagesContainer) {
        messagesContainer.style.display = 'none';
    }
}

function clearErrors() {
    // Clear all error/success displays
    const messagesContainer = document.getElementById('loginMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        messagesContainer.style.display = 'none';
    }
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    const successDiv = document.getElementById('loginSuccess');
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    // Clear individual field errors
    const fieldErrors = document.querySelectorAll('.error-message');
    fieldErrors.forEach(error => {
        if (error.id !== 'loginError') {
            error.textContent = '';
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
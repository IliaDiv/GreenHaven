document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on signup or login page
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  
  if (signupForm) {
    initializeSignupForm();
  }
  
  if (loginForm) {
    initializeLoginForm();
  }
  
  // Initialize password toggles
  initializePasswordToggles();
});

function initializeSignupForm() {
  const form = document.getElementById('signupForm');
  const formSuccess = document.getElementById('signupSuccess');
  
  // Get form fields
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsInput = document.getElementById('terms');
  
  // Get error elements
  const firstNameError = document.getElementById('firstNameError');
  const lastNameError = document.getElementById('lastNameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const termsError = document.getElementById('termsError');
  
  // Password strength indicator
  const strengthFill = document.querySelector('.strength-fill');
  const strengthText = document.querySelector('.strength-text');
  
  // Validation functions
  function validateFirstName(name) {
    if (name.trim() === '') {
      firstNameError.textContent = 'First name is required';
      return false;
    }
    if (name.trim().length < 2) {
      firstNameError.textContent = 'First name must be at least 2 characters';
      return false;
    }
    firstNameError.textContent = '';
    return true;
  }
  
  function validateLastName(name) {
    if (name.trim() === '') {
      lastNameError.textContent = 'Last name is required';
      return false;
    }
    if (name.trim().length < 2) {
      lastNameError.textContent = 'Last name must be at least 2 characters';
      return false;
    }
    lastNameError.textContent = '';
    return true;
  }
  
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() === '') {
      emailError.textContent = 'Email is required';
      return false;
    }
    if (!emailRegex.test(email)) {
      emailError.textContent = 'Please enter a valid email address';
      return false;
    }
    emailError.textContent = '';
    return true;
  }
  
  function validatePassword(password) {
    if (password === '') {
      passwordError.textContent = 'Password is required';
      updatePasswordStrength(0, 'Password strength');
      return false;
    }
    if (password.length < 8) {
      passwordError.textContent = 'Password must be at least 8 characters';
      updatePasswordStrength(1, 'Too short');
      return false;
    }
    
    let strength = 0;
    let strengthText = '';
    
    // Check password strength
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
      case 1:
      case 2:
        strengthText = 'Weak';
        break;
      case 3:
        strengthText = 'Fair';
        break;
      case 4:
        strengthText = 'Good';
        break;
      case 5:
        strengthText = 'Strong';
        break;
    }
    
    updatePasswordStrength(strength, strengthText);
    passwordError.textContent = '';
    return true;
  }
  
  function updatePasswordStrength(strength, text) {
    if (!strengthFill || !strengthText) return;
    
    strengthFill.className = 'strength-fill';
    
    switch (strength) {
      case 1:
      case 2:
        strengthFill.classList.add('weak');
        break;
      case 3:
        strengthFill.classList.add('fair');
        break;
      case 4:
        strengthFill.classList.add('good');
        break;
      case 5:
        strengthFill.classList.add('strong');
        break;
      default:
        strengthFill.style.width = '0%';
    }
    
    strengthText.textContent = text;
  }
  
  function validateConfirmPassword(password, confirmPassword) {
    if (confirmPassword === '') {
      confirmPasswordError.textContent = 'Please confirm your password';
      return false;
    }
    if (password !== confirmPassword) {
      confirmPasswordError.textContent = 'Passwords do not match';
      return false;
    }
    confirmPasswordError.textContent = '';
    return true;
  }
  
  function validateTerms(checked) {
    if (!checked) {
      termsError.textContent = 'You must agree to the terms and conditions';
      return false;
    }
    termsError.textContent = '';
    return true;
  }
  
  // Add input event listeners
  if (firstNameInput) {
    firstNameInput.addEventListener('input', function() {
      validateFirstName(this.value);
    });
  }
  
  if (lastNameInput) {
    lastNameInput.addEventListener('input', function() {
      validateLastName(this.value);
    });
  }
  
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      validateEmail(this.value);
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      validatePassword(this.value);
      if (confirmPasswordInput && confirmPasswordInput.value) {
        validateConfirmPassword(this.value, confirmPasswordInput.value);
      }
    });
  }
  
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      validateConfirmPassword(passwordInput.value, this.value);
    });
  }
  
  if (termsInput) {
    termsInput.addEventListener('change', function() {
      validateTerms(this.checked);
    });
  }
  
  // Form submission - Now properly integrated with server
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = firstNameInput.value;
    const lastName = lastNameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const terms = termsInput.checked;
    const newsletter = document.getElementById('newsletter').checked;
    
    // Validate all fields
    const isFirstNameValid = validateFirstName(firstName);
    const isLastNameValid = validateLastName(lastName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(password, confirmPassword);
    const isTermsValid = validateTerms(terms);
    
    if (isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isTermsValid) {
      const submitBtn = form.querySelector('.auth-submit-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnIcon = submitBtn.querySelector('.btn-icon');
      
      submitBtn.disabled = true;
      btnText.textContent = 'Creating Account...';
      btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      // Prepare form data for server
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('newsletter', newsletter ? 'on' : 'off');
      
      // Submit to server
      fetch('/register', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Registration successful
          form.reset();
          updatePasswordStrength(0, 'Password strength');
          formSuccess.classList.add('visible');
          formSuccess.style.display = 'flex';
          
          // Redirect to login after 2 seconds
          setTimeout(function() {
            window.location.href = '/login.html';
          }, 2000);
        } else {
          // Show error message
          alert(data.message || 'Registration failed. Please try again.');
          submitBtn.disabled = false;
          btnText.textContent = 'Create Account';
          btnIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
        }
      })
      .catch(error => {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
        submitBtn.disabled = false;
        btnText.textContent = 'Create Account';
        btnIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
      });
    }
  });
}

function initializeLoginForm() {
  // This function is now handled by login.js
  // Keep it here for compatibility but it won't be used
  console.log('Login form initialization is handled by login.js');
}

function initializePasswordToggles() {
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordInput = this.parentElement.querySelector('input');
      const icon = this.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}
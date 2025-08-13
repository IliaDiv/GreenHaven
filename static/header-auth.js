// Header Authentication Management with Server Session
document.addEventListener('DOMContentLoaded', function() {
  initializeHeader();
});

function initializeHeader() {
  // Check server session instead of just localStorage
  checkServerSession().then(userData => {
    const headerButtons = document.getElementById('headerButtons');
    const currentPage = getCurrentPage();
    
    if (userData) {
      // User is logged in
      renderLoggedInHeader(userData, currentPage);
    } else {
      // User is not logged in
      renderLoggedOutHeader(currentPage);
    }
  });
}

// Global functions that can be called from onclick attributes
window.toggleUserDropdown = function(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.toggle('show');
    console.log('Dropdown toggled, classes:', userMenu.classList.toString());
  } else {
    console.error('User menu not found');
  }
};

window.handleMenuClick = function(event, action) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('Menu item clicked:', action);
  
  // Close the dropdown
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.remove('show');
  }
  
  // Handle different menu actions
  switch(action) {
    case 'account':
      // Navigate to account page
      console.log('Navigating to account page');
      // window.location.href = '/account';
      break;
    case 'orders':
      // Navigate to orders page
      console.log('Navigating to orders page');
      // window.location.href = '/orders';
      break;
    case 'wishlist':
      // Navigate to wishlist page
      console.log('Navigating to wishlist page');
      // window.location.href = '/wishlist';
      break;
  }
};

window.handleLogout = function(event) {
  event.preventDefault();
  event.stopPropagation();
  
  logout();
};

function checkServerSession() {
  // Check with server if user is logged in
  return fetch('/api/check-session', {
    method: 'GET',
    credentials: 'include', // Important for cookies
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.logged_in && data.user) {
      // Store user data in localStorage for quick access
      localStorage.setItem('greenhaven_user', JSON.stringify(data.user));
      return data.user;
    } else {
      // Clear localStorage if server says not logged in
      localStorage.removeItem('greenhaven_user');
      return null;
    }
  })
  .catch(error => {
    console.error('Error checking session:', error);
    // Fallback to localStorage if server check fails
    return getCurrentUser();
  });
}

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  
  if (filename === 'index.html' || filename === '' || path === '/') {
    return 'home';
  } else if (filename === 'login.html' || path.includes('/login')) {
    return 'login';
  } else if (filename === 'signup.html' || path.includes('/signup')) {
    return 'signup';
  }
  return 'other';
}

function getCurrentUser() {
  // Fallback function to check localStorage
  const userData = localStorage.getItem('greenhaven_user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      localStorage.removeItem('greenhaven_user');
      return null;
    }
  }
  return null;
}

function renderLoggedOutHeader(currentPage) {
  const headerButtons = document.getElementById('headerButtons');
  if (!headerButtons) return;
  
  if (currentPage === 'login' || currentPage === 'signup') {
    // Don't show login button on login/signup pages
    headerButtons.innerHTML = '';
  } else if (currentPage === 'home') {
    // Only Login button on home page
    headerButtons.innerHTML = `
      <a href="/login.html" class="btn-outline">Login</a>
      <button class="btn-primary" onclick="window.location.href='/#ShopPlants'">Shop Now</button>
    `;
  } else {
    // Both Login and Shop Now on other pages
    headerButtons.innerHTML = `
      <a href="/login.html" class="btn-outline">Login</a>
      <button class="btn-primary" onclick="window.location.href='/#ShopPlants'">Shop Now</button>
    `;
  }
}

function renderLoggedInHeader(user, currentPage) {
  const headerButtons = document.getElementById('headerButtons');
  if (!headerButtons) return;
  
  const firstName = user.firstName || user.first_name || user.name || 'User';
  
  // Create the user greeting HTML
  const userGreetingHTML = `
    <div class="user-greeting">
      <span class="greeting-text">Hello, ${firstName}!</span>
      <div class="user-dropdown">
        <button class="user-menu-btn" id="userMenuBtn">
          <i class="fas fa-user-circle"></i>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-menu" id="userMenu">
          <a href="#" class="user-menu-item">
            <i class="fas fa-user"></i>
            My Account
          </a>
          <a href="#" class="user-menu-item">
            <i class="fas fa-shopping-bag"></i>
            My Orders
          </a>
          <a href="#" class="user-menu-item">
            <i class="fas fa-heart"></i>
            Wishlist
          </a>
          <hr class="user-menu-divider">
          <button class="user-menu-item logout-btn" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  `;
  
  if (currentPage === 'login' || currentPage === 'signup') {
    // Only show greeting on auth pages
    headerButtons.innerHTML = userGreetingHTML;
  } else {
    // Show greeting and shop button on other pages
    headerButtons.innerHTML = userGreetingHTML + `
      <button class="btn-primary" onclick="window.location.href='/#ShopPlants'">Shop Now</button>
    `;
  }
  
  // Set up dropdown functionality after rendering
  setTimeout(setupDropdown, 0);
}

function setupDropdown() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');
  
  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.user-dropdown')) {
        userMenu.classList.remove('show');
      }
    });
  }
}

function logout() {
  // Confirm logout
  if (!confirm('Are you sure you want to logout?')) {
    return;
  }
  
  // Show loading state
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    logoutBtn.disabled = true;
  }
  
  // Send logout request to server
  fetch('/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    // Clear localStorage
    localStorage.removeItem('greenhaven_user');
    localStorage.removeItem('isLoggedIn');
    
    // Redirect to home page
    window.location.href = '/';
  })
  .catch(error => {
    console.error('Logout error:', error);
    // Even on error, clear local storage and redirect
    localStorage.removeItem('greenhaven_user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/';
  });
}

// Function to set user as logged in (called from auth.js or login.js)
function setUserLoggedIn(userData) {
  localStorage.setItem('greenhaven_user', JSON.stringify(userData));
  localStorage.setItem('isLoggedIn', 'true');
  initializeHeader(); // Refresh header
}

// Make functions available globally
window.toggleUserMenu = function() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.toggle('show');
  }
};
window.logout = logout;
window.setUserLoggedIn = setUserLoggedIn;
window.initializeHeader = initializeHeader;
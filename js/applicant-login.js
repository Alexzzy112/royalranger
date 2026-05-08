const loginForm = document.getElementById('applicant-login-form');
const loginMessage = document.getElementById('login-message');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = '';

    const email = loginForm.querySelector('#applicant-email').value.trim();
    const password = loginForm.querySelector('#applicant-password').value.trim();

    if (!email || !password) {
      loginMessage.textContent = 'Please enter your email and password.';
      return;
    }

    const response = await fetch('/api/applicant/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        loginMessage.textContent = 'Login failed. Please check your credentials.';
        return;
      }
      loginMessage.textContent = payload.error || 'Login failed. Please check your credentials.';
      return;
    }

    window.location.href = '/applicant-dashboard.html';
  });
}

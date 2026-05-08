const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    registerMessage.textContent = '';

    const password = registerForm.querySelector('#password').value.trim();
    const confirmPassword = registerForm.querySelector('#confirm_password').value.trim();
    const email = registerForm.querySelector('#email').value.trim();

    if (!email || !password || !confirmPassword) {
      registerMessage.textContent = 'Please complete the email and password fields.';
      return;
    }

    if (password.length < 8) {
      registerMessage.textContent = 'Password must be at least 8 characters long.';
      return;
    }

    if (password !== confirmPassword) {
      registerMessage.textContent = 'Passwords do not match.';
      return;
    }

    const formData = new FormData(registerForm);
    const response = await fetch('/api/register', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const payload = await response.json();
      registerMessage.textContent = payload.error || 'Registration failed. Please try again.';
      return;
    }

    const result = await response.json();
    registerMessage.textContent = `Registration successful. Your ID: ${result.unique_id}`;
    registerForm.reset();
  });
}

// assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg  = document.getElementById('loginMessage');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email    = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;

    if (!email || !password) {
      if (msg) msg.textContent = 'Please enter email and password.';
      return;
    }

    fetch('api/login_step1.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error('login_step1 HTTP error:', res.status, text);
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log('login_step1 response:', data);

        if (data.success) {
          // Save email for OTP step
          localStorage.setItem('pendingEmail', data.email);

          if (msg) {
            if (data.debug_otp) {
              msg.textContent = `OTP sent. (Testing OTP: ${data.debug_otp})`;
            } else {
              msg.textContent = 'OTP sent. Please check your email.';
            }
          }

          // Go to OTP page
          setTimeout(() => {
            window.location.href = 'otp.html';
          }, 1200);
        } else {
          if (msg) msg.textContent = data.message || 'Login failed.';
        }
      })
      .catch((err) => {
        console.error('login_step1 fetch error:', err);
        if (msg) msg.textContent = 'Error connecting to server.';
      });
  });
});

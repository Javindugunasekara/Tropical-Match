// assets/js/otp.js

document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('otpForm');
  const otpInfo  = document.getElementById('otpInfo');
  const otpMsg   = document.getElementById('otpMessage');
  const otpInput = document.getElementById('otpInput');

  if (!form) return;

  const email = localStorage.getItem('pendingEmail');

  if (!email) {
    otpInfo.textContent = 'No pending login found. Please login again.';
    form.style.display = 'none';
    return;
  }

  otpInfo.textContent = `We have sent an OTP to: ${email}`;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const otp = otpInput.value.trim();
    if (!otp) {
      otpMsg.textContent = 'Please enter the OTP.';
      return;
    }

    fetch('api/login_step2.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error('login_step2 HTTP error:', res.status, text);
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log('login_step2 response:', data);

        if (data.success) {
          // Save final login token + user info
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userEmail', data.email);
          localStorage.setItem('userName', data.name);
          localStorage.removeItem('pendingEmail');

          otpMsg.textContent = 'OTP verified. Logging you in...';

          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1200);
        } else {
          otpMsg.textContent = data.message || 'OTP verification failed.';
        }
      })
      .catch((err) => {
        console.error('login_step2 fetch error:', err);
        otpMsg.textContent = 'Error verifying OTP.';
      });
  });
});

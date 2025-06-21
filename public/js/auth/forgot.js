let countdown = 60;
let timer;

document.getElementById('sendBtn').addEventListener('click', sendOtp);
document.getElementById('resendBtn').addEventListener('click', resendOtp);
document.getElementById('verifyBtn').addEventListener('click', verifyOtp);
document.getElementById('newPassword').addEventListener('input', checkPasswordStrength);
document.getElementById('forgotForm').addEventListener('submit', resetPassword);

function startCountdown() {
  const countdownEl = document.getElementById('countdown');
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;

  timer = setInterval(() => {
    countdown--;
    countdownEl.innerText = countdown;
    if (countdown <= 0) {
      clearInterval(timer);
      resendBtn.disabled = false;
      resendBtn.innerText = 'Resend OTP';
      resendBtn.style.cursor = 'pointer';
    }
  }, 1000);
}

function sendOtp() {
  const email = document.getElementById('email').value;
  const role = document.getElementById('role').value;
  const loader = document.getElementById('loader');
  const sendBtn = document.getElementById('sendBtn');
  const resendBtn = document.getElementById('resendBtn');
  const msg = document.getElementById('message');

  loader.style.display = 'block';
  sendBtn.disabled = true;
  resendBtn.disabled = true;

  fetch('/auth/forgot/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  })
  .then(res => res.json())
  .then(data => {
    loader.style.display = 'none';
    sendBtn.disabled = false;

    if (data.success) {
      document.getElementById('otp').style.display = 'block';
      document.getElementById('verifyBtn').style.display = 'block';
      resendBtn.style.display = 'block';
      countdown = 60;
      resendBtn.innerHTML = `Resend OTP (<span id="countdown">60</span>s)`;
      startCountdown();
      msg.className = 'success';
      msg.innerText = "OTP sent to your email.";
    } else {
      msg.className = '';
      msg.innerText = data.message;
    }
  })
  .catch(() => {
    loader.style.display = 'none';
    sendBtn.disabled = false;
    msg.innerText = "Something went wrong. Try again.";
  });
}

function resendOtp() {
  countdown = 60;
  sendOtp();
}

function verifyOtp() {
  const email = document.getElementById('email').value;
  const otp = document.getElementById('otp').value;

  fetch('/auth/forgot/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
  .then(res => res.json())
  .then(data => {
    if (data.verified) {
      document.getElementById('newPassword').style.display = 'block';
      document.getElementById('confirmPassword').style.display = 'block';
      document.getElementById('resetBtn').style.display = 'block';
      document.getElementById('message').innerText = "OTP Verified. Set your new password.";
      document.getElementById('message').className = 'success';
    } else {
      document.getElementById('message').innerText = data.message;
    }
  });
}

function checkPasswordStrength() {
  const pass = document.getElementById('newPassword').value;
  const strengthText = document.getElementById('passwordStrength');

  if (pass.length < 6) {
    strengthText.innerText = 'Weak: At least 6 characters';
  } else if (!/\d/.test(pass) || !/[A-Za-z]/.test(pass)) {
    strengthText.innerText = 'Medium: Use letters & numbers';
  } else if (!/[!@#$%^&*]/.test(pass)) {
    strengthText.innerText = 'Strong: Add a special character (!@#$%^&*)';
  } else {
    strengthText.innerText = 'Very Strong';
  }
}

function resetPassword(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const role = document.getElementById('role').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const msg = document.getElementById('message');

  if (newPassword !== confirmPassword) {
    msg.innerText = "Passwords do not match.";
    return;
  }

  fetch('/auth/forgot/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, newPassword })
  })
  .then(res => res.json())
  .then(data => {
    msg.innerText = data.message;
    if (data.success) {
      alert('Password changed! Redirecting to login...');
      window.location.href = '/auth/login';
    }
  });
}

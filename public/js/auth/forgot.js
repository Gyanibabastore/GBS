let countdown = 60;
let timer;

const sendBtn = document.getElementById('sendBtn');
const resendBtn = document.getElementById('resendBtn');
const verifyBtn = document.getElementById('verifyBtn');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const passwordFields = document.getElementById('passwordFields');
const loader = document.getElementById('loader');
const msg = document.getElementById('message');

sendBtn.addEventListener('click', sendOtp);
resendBtn.addEventListener('click', resendOtp);
verifyBtn.addEventListener('click', verifyOtp);
document.getElementById('toggleNewPass').addEventListener('click', () => toggleField('newPassword'));
document.getElementById('toggleConfirmPass').addEventListener('click', () => toggleField('confirmPassword'));
document.getElementById('newPassword').addEventListener('input', checkPasswordStrength);
document.getElementById('confirmPassword').addEventListener('input', checkMatch);
document.getElementById('forgotForm').addEventListener('submit', resetPassword);

function startCountdown() {
  resendBtn.disabled = true;
  resendBtn.style.display = 'block';

  timer = setInterval(() => {
    countdown--;
    document.getElementById('countdown').innerText = countdown;
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

  loader.style.display = 'flex';
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
        verifyBtn.style.display = 'block';
        countdown = 60;
        resendBtn.innerHTML = `Resend OTP (<span id="countdown">60</span>s)`;
        startCountdown();
        sendBtn.classList.add('hidden');
        showToast('success', 'OTP sent to your email.');
      } else {
        showToast('error', data.message);
      }
    })
    .catch(() => {
      loader.style.display = 'none';
      sendBtn.disabled = false;
      showToast('error', 'Something went wrong. Try again.');
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
        document.getElementById('otp').readOnly = true;
        verifyBtn.disabled = true;
        sendBtn.disabled = true;
        resendBtn.disabled = true;
        passwordFields.style.display = 'block';
        showToast('success', 'OTP Verified. Set your new password.');
      } else {
        showToast('error', data.message);
      }
    });
}

function toggleField(id) {
  const field = document.getElementById(id);
  field.type = field.type === 'password' ? 'text' : 'password';
}

function checkPasswordStrength() {
  const pass = newPassword.value;
  updateRule('rule-length', pass.length >= 8);
  updateRule('rule-upper', /[A-Z]/.test(pass));
  updateRule('rule-lower', /[a-z]/.test(pass));
  updateRule('rule-number', /[0-9]/.test(pass));
  updateRule('rule-special', /[!@#$%^&*(),.?":{}|<>]/.test(pass));
}

function updateRule(id, passed) {
  const el = document.getElementById(id);
  if (passed) el.classList.add('valid');
  else el.classList.remove('valid');
}

function checkMatch() {
  const pass = newPassword.value;
  const confirm = confirmPassword.value;
  const status = document.getElementById('matchStatus');

  if (!confirm) return status.innerText = '';

  if (pass === confirm) {
    status.innerText = '✅ Passwords match';
    status.style.color = 'green';
  } else {
    status.innerText = '❌ Passwords do not match';
    status.style.color = 'red';
  }
}

function resetPassword(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const role = document.getElementById('role').value;
  const pass = newPassword.value;
  const confirm = confirmPassword.value;

  if (pass !== confirm) {
    showToast('error', 'Passwords do not match.');
    return;
  }

  fetch('/auth/forgot/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, newPassword: pass })
  })
    .then(res => res.json())
    .then(data => {
      showToast(data.success ? 'success' : 'error', data.message);
      if (data.success) {
        setTimeout(() => window.location.href = '/auth/login', 2000);
      }
    });
}

function showToast(type, text) {
  msg.innerText = text;
  msg.className = type;
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
    msg.className = '';
  }, 3000);
}

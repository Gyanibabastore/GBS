const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('otpForm');
const msg = document.getElementById('msg');

const buyerBtn = document.getElementById('buyerBtn');
const sellerBtn = document.getElementById('sellerBtn');
const roleInput = document.getElementById('role');

const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const passwordInput = loginForm.querySelector('input[name="password"]');
const emailInput = loginForm.querySelector('input[name="email"]');
const passwordError = document.getElementById('passwordError');
const resendInfo = document.getElementById('resendInfo');

// Checklist spans
const passwordChecklist = document.getElementById('passwordChecklist');
const lengthCheck = document.getElementById('lengthCheck');
const uppercaseCheck = document.getElementById('uppercaseCheck');
const numberCheck = document.getElementById('numberCheck');
const specialCheck = document.getElementById('specialCheck');

let resendCooldown = 30;
let resendTimer = null;

buyerBtn.onclick = () => {
  roleInput.value = 'buyer';
  buyerBtn.classList.add('active');
  sellerBtn.classList.remove('active');
};

sellerBtn.onclick = () => {
  roleInput.value = 'seller';
  sellerBtn.classList.add('active');
  buyerBtn.classList.remove('active');
};

function showLoader(button, text) {
  button.disabled = true;
  button.innerHTML = `${text}<span class="spinner"></span>`;
}

function hideLoader(button, text) {
  button.disabled = false;
  button.innerHTML = text;
}

function validatePassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// ✅ Live checklist with color + border
passwordInput.addEventListener('focus', () => {
  passwordChecklist.style.display = 'block';
});

passwordInput.addEventListener('blur', () => {
  if (!passwordInput.value) passwordChecklist.style.display = 'none';
});

passwordInput.addEventListener('input', () => {
  const pwd = passwordInput.value;

  const lengthOK = pwd.length >= 8;
  const uppercaseOK = /[A-Z]/.test(pwd);
  const numberOK = /\d/.test(pwd);
  const specialOK = /[\W_]/.test(pwd);
  const allOK = lengthOK && uppercaseOK && numberOK && specialOK;

  lengthCheck.textContent = (lengthOK ? "✅" : "❌") + " 8+ chars";
  uppercaseCheck.textContent = (uppercaseOK ? "✅" : "❌") + " Uppercase";
  numberCheck.textContent = (numberOK ? "✅" : "❌") + " Number";
  specialCheck.textContent = (specialOK ? "✅" : "❌") + " Special char";

  passwordInput.style.border = allOK ? '2px solid green' : '1px solid #ccc';
  passwordError.innerHTML = allOK
    ? ''
    : '<span style="color:red">Password must meet all requirements.</span>';
});

// 👁️ Show/Hide toggle
const eyeToggle = document.createElement('span');
eyeToggle.innerHTML = '👁️';
eyeToggle.style.cursor = 'pointer';
eyeToggle.style.position = 'absolute';
eyeToggle.style.right = '10px';
eyeToggle.style.top = '50%';
eyeToggle.style.transform = 'translateY(-50%)';
eyeToggle.style.userSelect = 'none';

const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
passwordInput.parentNode.insertBefore(wrapper, passwordInput);
wrapper.appendChild(passwordInput);
wrapper.appendChild(eyeToggle);

eyeToggle.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type');
  passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
  eyeToggle.innerHTML = type === 'password' ? '🙈' : '👁️';
});

function startResendCooldown() {
  resendCooldown = 30;
  sendOtpBtn.disabled = true;
  resendInfo.style.display = "block";
  resendInfo.innerText = `You can resend OTP in ${resendCooldown} seconds`;

  resendTimer = setInterval(() => {
    resendCooldown--;
    resendInfo.innerText = `You can resend OTP in ${resendCooldown} seconds`;

    if (resendCooldown <= 0) {
      clearInterval(resendTimer);
      sendOtpBtn.disabled = false;
      resendInfo.style.display = "none";
    }
  }, 1000);
}

sendOtpBtn.addEventListener('click', async () => {
  msg.textContent = '';
  msg.style.color = '';

  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const role = formData.get('role');
  const password = formData.get('password');

  if (!validatePassword(password)) {
    passwordError.innerHTML = '<span style="color:red">Password must meet all requirements.</span>';
    return;
  }

  showLoader(sendOtpBtn, 'Sending');

  try {
    const res = await fetch('/auth/login/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, password })
    });

    const data = await res.json();
    hideLoader(sendOtpBtn, 'Resend OTP');

    if (res.redirected) {
      window.location.href = res.url;
      return;
    }

    if (data.success) {
      msg.style.color = 'green';
      msg.textContent = 'OTP sent successfully';

      emailInput.readOnly = true;
      passwordInput.readOnly = true;
      buyerBtn.disabled = true;
      sellerBtn.disabled = true;

      otpForm.email.value = email;
      otpForm.role.value = role;
      loginForm.style.display = 'none';
      otpForm.style.display = 'block';
      startResendCooldown();
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message || 'Something went wrong';
    }
  } catch (err) {
    hideLoader(sendOtpBtn, 'Send OTP');
    msg.style.color = 'red';
    msg.textContent = 'Error sending OTP';
  }
});

otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.style.color = '';
  showLoader(verifyOtpBtn, 'Verifying');

  const formData = new FormData(otpForm);
  const otp = formData.get('otp');
  const email = formData.get('email');
  const role = formData.get('role');

  try {
    const res = await fetch('/auth/login/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, email, role })
    });

    const data = await res.json();
    hideLoader(verifyOtpBtn, 'Login');

    if (res.redirected) {
      window.location.href = res.url;
      return;
    }

    if (data.verified) {
      emailInput.readOnly = true;
      sendOtpBtn.disabled = true;
      clearInterval(resendTimer);
      resendInfo.innerText = 'Verified successfully!';

      window.location.href = `/${role}/dashboard/${data.userId}`;
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message || 'Invalid OTP';
    }
  } catch (err) {
    hideLoader(verifyOtpBtn, 'Login');
    msg.style.color = 'red';
    msg.textContent = 'Error verifying OTP';
  }
});

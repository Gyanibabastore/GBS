// Original working code + improved with live password checklist and restricted email editing after verification
let otpVerified = false;
let sendingOtp = false;
let verifyingOtp = false;
let countdownTimer;
const resendCooldown = 30;
let resendLocked = false; // ✅ Prevent manual resend early

window.onload = () => selectRole('buyer');

function selectRole(role) {
  document.getElementById('selectedRole').value = role;
  document.getElementById('buyerFields').style.display = role === 'buyer' ? 'block' : 'none';
  document.getElementById('sellerFields').style.display = role === 'seller' ? 'block' : 'none';

  document.getElementById('buyerBtn').classList.remove('active');
  document.getElementById('sellerBtn').classList.remove('active');
  document.getElementById(role + 'Btn').classList.add('active');

  document.getElementById('formHeading').innerText =
    role === 'buyer' ? 'Create Buyer Account' : 'Create Seller Account';
}
// 👁️ Show/hide password toggle
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

togglePassword?.addEventListener('click', () => {
  const pwd = document.querySelector('input[name="password"]');
  const type = pwd.type === 'password' ? 'text' : 'password';
  pwd.type = type;
  togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});

toggleConfirmPassword?.addEventListener('click', () => {
  const cpwd = document.querySelector('input[name="confirmPassword"]');
  const type = cpwd.type === 'password' ? 'text' : 'password';
  cpwd.type = type;
  toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
});

document.getElementById("signupForm")?.addEventListener("submit", function (event) {
  if (!otpVerified) {
    alert("Please verify your email OTP before signing up.");
    event.preventDefault();
    return false;
  }

  const form = event.target;
  const upi = form["upi"].value;
  const password = form["password"].value;
  const confirmPassword = form["confirmPassword"].value;

  const upiRegex = /^[\w.-]+@[\w]+$/;
  const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!upiRegex.test(upi)) {
    alert("Please enter a valid UPI ID (e.g., name@bank)");
    event.preventDefault();
    return false;
  }

  if (!pwdRegex.test(password)) {
    alert("Password must be 8+ chars with 1 uppercase, 1 number, and 1 special char.");
    event.preventDefault();
    return false;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    event.preventDefault();
    return false;
  }
});

function startResendTimer(button) {
  let timeLeft = resendCooldown;
  resendLocked = true; // ✅ Prevent early resend
  const info = document.getElementById("resendInfo");
  const countdown = document.getElementById("countdown");

  info.style.display = "block";
  countdown.innerText = timeLeft;
  button.disabled = true;
  button.style.display = 'none'; // ✅ Hide the button completely during countdown

  countdownTimer = setInterval(() => {
    timeLeft--;
    countdown.innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      info.style.display = "none";
      button.disabled = false;
      button.innerText = 'Resend OTP';
      button.style.display = 'inline-block'; // ✅ Show the button back
      resendLocked = false;
    }
  }, 1000);
}

document.getElementById("otpBtn")?.addEventListener("click", function () {
  const btn = this;
  if (sendingOtp || btn.disabled || resendLocked) return; // ✅ Lock resend during countdown

  const emailInput = document.querySelector('input[name="email"]');
  const email = emailInput.value;
  const name = document.querySelector('input[name="name"]').value;
  const role = document.querySelector('input[name="role"]').value;

  if (!email || !name) {
    alert("Please enter your name and email first");
    return;
  }

  sendingOtp = true;
  btn.innerText = 'Sending...';

  fetch('/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, role })
  })
    .then(res => res.json())
    .then(data => {
      sendingOtp = false;
      if (data.success) {
        document.getElementById('otpSection').style.display = 'flex';
        btn.innerText = 'Resend OTP';
        emailInput.readOnly = true; // ✅ Prevent editing after send
        startResendTimer(btn);
        alert("OTP sent to your email");
      } else {
        btn.innerText = 'Verify Email';
        alert(data.message || "Failed to send OTP. Try again.");
      }
    });
});

document.getElementById("verifyOtpBtn")?.addEventListener("click", function () {
  const btn = this;
  if (verifyingOtp) return;

  const emailInput = document.querySelector('input[name="email"]');
  const otpInput = document.querySelector('input[name="otp"]');
  const email = emailInput.value;
  const otp = otpInput.value;

  verifyingOtp = true;
  btn.innerText = 'Verifying...';

  fetch('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      verifyingOtp = false;
      if (data.verified) {
        otpVerified = true;
        alert("Email verified successfully.");
        emailInput.readOnly = true;
        otpInput.disabled = true;
        btn.style.display = 'none';
        const otpBtn = document.getElementById('otpBtn');
        otpBtn.disabled = true;
        otpBtn.innerText = 'Verified';
        clearInterval(countdownTimer);
        document.getElementById("resendInfo").style.display = "none";
      } else {
        btn.innerText = 'Submit OTP';
        alert("Invalid OTP. Please try again.");
      }
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.querySelector('input[name="password"]');
  const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  passwordInput?.addEventListener("input", () => {
    const pwd = passwordInput.value;
    const lengthCheck = pwd.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(pwd);
    const numberCheck = /\d/.test(pwd);
    const specialCheck = /[\W_]/.test(pwd);

    let checklist = [];
    if (lengthCheck) checklist.push('✅ 8+ chars');
    else checklist.push('❌ 8+ chars');
    if (uppercaseCheck) checklist.push('✅ Uppercase');
    else checklist.push('❌ Uppercase');
    if (numberCheck) checklist.push('✅ Number');
    else checklist.push('❌ Number');
    if (specialCheck) checklist.push('✅ Special char');
    else checklist.push('❌ Special char');

    passwordError.innerHTML = checklist.join(' <br> ');
  });

  confirmPasswordInput?.addEventListener("input", () => {
    confirmPasswordError.innerText =
      confirmPasswordInput.value !== passwordInput.value
        ? "Passwords do not match."
        : "";
  });

  document.getElementById('buyerBtn')?.addEventListener('click', () => selectRole('buyer'));
  document.getElementById('sellerBtn')?.addEventListener('click', () => selectRole('seller'));
});
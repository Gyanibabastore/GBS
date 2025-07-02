// signup.js with live email validation

let otpVerified = false;
let sendingOtp = false;
let verifyingOtp = false;
let countdownTimer;
const resendCooldown = 30;
let resendLocked = false;

window.onload = () => selectRole('buyer');

function selectRole(role) {
  document.getElementById('selectedRole').value = role;
  document.getElementById('buyerFields').style.display = role === 'buyer' ? 'block' : 'none';
  document.getElementById('sellerFields').style.display = role === 'seller' ? 'block' : 'none';
  document.getElementById('buyerBtn').classList.remove('active');
  document.getElementById('sellerBtn').classList.remove('active');
  document.getElementById(role + 'Btn').classList.add('active');
  document.getElementById('formHeading').innerText = role === 'buyer' ? 'Create Buyer Account' : 'Create Seller Account';
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

togglePassword?.addEventListener('click', () => {
  const pwd = document.querySelector('input[name="password"]');
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
  togglePassword.textContent = pwd.type === 'password' ? '👁️' : '🙈';
});

toggleConfirmPassword?.addEventListener('click', () => {
  const cpwd = document.querySelector('input[name="confirmPassword"]');
  cpwd.type = cpwd.type === 'password' ? 'text' : 'password';
  toggleConfirmPassword.textContent = cpwd.type === 'password' ? '👁️' : '🙈';
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
  resendLocked = true;
  const info = document.getElementById("resendInfo");
  const countdown = document.getElementById("countdown");

  info.style.display = "block";
  countdown.innerText = timeLeft;
  button.disabled = true;
  button.style.display = 'none';

  countdownTimer = setInterval(() => {
    timeLeft--;
    countdown.innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      info.style.display = "none";
      button.disabled = false;
      button.innerText = 'Resend OTP';
      button.style.display = 'inline-block';
      resendLocked = false;
    }
  }, 1000);
}

document.getElementById("otpBtn")?.addEventListener("click", function () {
  const btn = this;
  if (sendingOtp || btn.disabled || resendLocked) return;

  const emailInput = document.querySelector('input[name="email"]');
  const email = emailInput.value;
  const name = document.querySelector('input[name="name"]').value;
  const role = document.querySelector('input[name="role"]').value;

  if (!email || !name) {
    alert("Please enter your name and email first");
    return;
  }

  if (!isValidEmail(email) || email.includes('+')) {
    alert("Please enter a valid email without '+' symbol.");
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
        emailInput.readOnly = true;
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
  const emailInput = document.querySelector('input[name="email"]');
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const emailError = document.getElementById("emailError");

  passwordInput?.addEventListener("input", () => {
    const pwd = passwordInput.value;
    const lengthCheck = pwd.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(pwd);
    const numberCheck = /\d/.test(pwd);
    const specialCheck = /[\W_]/.test(pwd);

    let checklist = [];
    checklist.push(lengthCheck ? '✅ 8+ chars' : '❌ 8+ chars');
    checklist.push(uppercaseCheck ? '✅ Uppercase' : '❌ Uppercase');
    checklist.push(numberCheck ? '✅ Number' : '❌ Number');
    checklist.push(specialCheck ? '✅ Special char' : '❌ Special char');

    passwordError.innerHTML = checklist.join(' <br> ');
  });

  confirmPasswordInput?.addEventListener("input", () => {
    confirmPasswordError.innerText = confirmPasswordInput.value !== passwordInput.value
      ? "Passwords do not match."
      : "";
  });

emailInput?.addEventListener("input", () => {
  const email = emailInput.value.trim();

  if (!email || (isValidEmail(email) && !email.includes('+'))) {
    emailError.innerHTML = "";
    emailInput.style.border = "1px solid #ccc"; // default border
  } else {
    emailError.innerHTML = "Not a valid email";
    emailInput.style.border = "2px solid red";
  }
});



  document.getElementById('buyerBtn')?.addEventListener('click', () => selectRole('buyer'));
  document.getElementById('sellerBtn')?.addEventListener('click', () => selectRole('seller'));
});

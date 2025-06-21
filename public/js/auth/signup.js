let otpVerified = false;
let sendingOtp = false;
let verifyingOtp = false;
let countdownTimer;
const resendCooldown = 30;

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
  const info = document.getElementById("resendInfo");
  info.style.display = "block";
  info.innerText = `You can resend OTP in ${timeLeft} seconds`;

  button.disabled = true;
  countdownTimer = setInterval(() => {
    timeLeft--;
    info.innerText = `You can resend OTP in ${timeLeft} seconds`;
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      info.style.display = "none";
      button.disabled = false;
      button.innerText = 'Resend OTP';
    }
  }, 1000);
}

document.getElementById("otpBtn")?.addEventListener("click", function () {
  const btn = this;
  if (sendingOtp || btn.disabled) return;

  const email = document.querySelector('input[name="email"]').value;
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

  const email = document.querySelector('input[name="email"]').value;
  const otp = document.querySelector('input[name="otp"]').value;

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
        document.querySelector('input[name="email"]').readOnly = true;
        document.querySelector('input[name="otp"]').disabled = true;
        btn.style.display = 'none';
        const otpBtn = document.getElementById('otpBtn');
        otpBtn.disabled = true;
        otpBtn.innerText = 'Verified';
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
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    passwordError.innerText = !regex.test(pwd)
      ? "Password must be 8+ chars, 1 uppercase, 1 number, 1 special char."
      : "";
  });

  confirmPasswordInput?.addEventListener("input", () => {
    confirmPasswordError.innerText =
      confirmPasswordInput.value !== passwordInput.value
        ? "Passwords do not match."
        : "";
  });

  // ✅ Fix: Add role selection listeners
  document.getElementById('buyerBtn')?.addEventListener('click', () => selectRole('buyer'));
  document.getElementById('sellerBtn')?.addEventListener('click', () => selectRole('seller'));
});

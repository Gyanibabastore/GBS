const form = document.getElementById('editProfileForm');
const otpSection = document.getElementById('otpSection');
const submitBtn = document.getElementById('submitBtn');
const buyerIdInput = document.querySelector('input[name="buyerId"]');

if (!form || !otpSection || !submitBtn || !buyerIdInput) {
  console.error("❌ Required DOM elements are missing.");
  alert("⚠️ Page load error. Please refresh.");
} else {
  const buyerId = buyerIdInput.value;
  let otpSent = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    if (!otpSent) {
      // 1. SEND OTP
      try {
        const res = await fetch(`/buyer/${buyerId}/profile/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          otpSent = true;
          otpSection.classList.add('show');
          submitBtn.textContent = 'Save Changes';
          alert('✅ OTP sent to your email.');
        } else {
          alert(`❌ ${result.message || 'Failed to send OTP.'}`);
        }
      } catch (err) {
        console.error('❌ Error sending OTP:', err);
        alert('⚠️ Network error while sending OTP. Try again.');
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }

    } else {
      // 2. VERIFY OTP → UPDATE PROFILE
      try {
        const verifyRes = await fetch(`/buyer/${buyerId}/profile/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const verifyResult = await verifyRes.json();

        if (!verifyRes.ok || !verifyResult.success || !verifyResult.verified) {
          alert(`❌ ${verifyResult.message || 'OTP verification failed.'}`);
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
          return;
        }

        // 3. UPDATE PROFILE
        const updateRes = await fetch(`/buyer/${buyerId}/profile/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const updateResult = await updateRes.json();

        if (updateRes.ok && updateResult.success) {
          alert('✅ Profile updated successfully!');
          window.location.href = `/buyer/${buyerId}/profile`;
        } else {
          alert(`❌ ${updateResult.message || 'Failed to update profile.'}`);
        }

      } catch (err) {
        console.error('❌ Error verifying OTP or updating profile:', err);
        alert('⚠️ An unexpected error occurred. Please try again.');
      } finally {
        submitBtn.textContent = 'Save Changes';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  });
}

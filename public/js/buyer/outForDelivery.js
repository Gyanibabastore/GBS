document.addEventListener("DOMContentLoaded", () => {
  // === Toggle Expand Form ===
  const toggleBtn = document.getElementById("toggleExpandBtn");
  const form = document.getElementById("expand-card");

  if (toggleBtn && form) {
    toggleBtn.addEventListener("click", () => {
      const isVisible = form.style.display === "block";
      form.style.display = isVisible ? "none" : "block";

      if (!isVisible) {
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // === Dynamic Dropdowns Based on Brand ===
  const brandSelect = document.querySelector("select[name='brand']");
  const modelSelect = document.querySelector("select[name='model']");
  const variantSelect = document.querySelector("select[name='variant']");
  const colorSelect = document.querySelector("select[name='color']");
  const pincodeSelect = document.querySelector("select[name='pincode']");

  function populateOptions(selectElement, options) {
    selectElement.innerHTML = '<option selected disabled>Select</option>';
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      selectElement.appendChild(option);
    });
  }

  brandSelect.addEventListener("change", () => {
    const selectedBrand = brandSelect.value;
    const data = dropdownMap[selectedBrand];

    if (data) {
      populateOptions(modelSelect, data.models);
      populateOptions(variantSelect, data.variants);
      populateOptions(colorSelect, data.colors);
      populateOptions(pincodeSelect, data.pincodes);
    } else {
      populateOptions(modelSelect, []);
      populateOptions(variantSelect, []);
      populateOptions(colorSelect, []);
      populateOptions(pincodeSelect, []);
    }
  });

  // === Flash Message Alert (CSP-Safe) ===
  const flashDiv = document.getElementById("flash-messages");
  if (flashDiv) {
    const errorMsg = flashDiv.dataset.error;
    const successMsg = flashDiv.dataset.success;

    if (errorMsg) {
      alert(errorMsg);
    } else if (successMsg) {
      alert(successMsg);
    }
  }
});

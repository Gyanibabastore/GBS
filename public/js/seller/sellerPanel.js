let cart = [];
let models = [];

document.addEventListener("DOMContentLoaded", () => {
  try {
    const modelData = document.getElementById("models-data");
    models = JSON.parse(modelData.textContent || "[]");
  } catch (err) {
    console.error("Failed to parse models:", err);
    models = [];
  }

  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index);
      if (!isNaN(index)) addToCart(index);
    });
  });

  document.getElementById("place-order-btn")?.addEventListener("click", placeOrder);

  document.getElementById("showMorePending")?.addEventListener("click", () => {
    document.querySelectorAll(".pending-order.d-none").forEach(el => el.classList.remove("d-none"));
    document.getElementById("showMorePending").remove();
  });

  document.getElementById("showMoreDelivered")?.addEventListener("click", () => {
    document.querySelectorAll(".delivered-order.d-none").forEach(el => el.classList.remove("d-none"));
    document.getElementById("showMoreDelivered").remove();
  });

  const searchBox = document.getElementById('search-box');
  const modelCards = document.querySelectorAll('#model-list .model-card');

  searchBox?.addEventListener('input', () => {
    const query = searchBox.value.trim().toLowerCase();
    modelCards.forEach(card => {
      const title = card.querySelector('.card-title').innerText.toLowerCase();
      card.closest('.col-md-4').style.display = title.includes(query) ? 'block' : 'none';
    });
  });
});

function addToCart(index) {
  const model = models[index];
  if (!model) return;

  const existing = cart.find(item =>
    item.title === model.title && item.color === model.color
  );

  if (existing) {
    if (existing.quantity >= model.stock) {
      alert(`🚫 Only ${model.stock} item(s) available in stock.`);
      return;
    }
    existing.quantity += 1;
  } else {
    if (model.stock < 1) {
      alert("🚫 Out of stock.");
      return;
    }
    cart.push({
      _id: model._id,
      title: model.title,
      booking: model.booking,
      returnAmount: model.returnAmount,
      buyerprice: model.buyerprice,
      color: model.color,
      brand: model.brand,
      image: model.image,
      quantity: 1
    });
  }

  renderCart();
}

function changeQty(index, delta) {
  const item = cart[index];
  const model = models.find(m => m.title === item.title && m.color === item.color);
  if (!model) return;

  const newQty = item.quantity + delta;
  if (newQty > model.stock) {
    alert(`🚫 Cannot exceed stock limit (${model.stock}) for this item.`);
    return;
  }

  item.quantity = newQty;
  if (item.quantity <= 0) cart.splice(index, 1);
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart-list");
  const totalDisplay = document.getElementById("total-amount");
  cartList.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += item.quantity * item.booking;
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <div>
        <strong>${item.title}</strong><br/>
        Color: ${item.color}<br/>
        Qty: ${item.quantity} × ₹${item.booking}
      </div>
      <div>
        <button class="btn btn-sm btn-outline-secondary me-1 qty-decrease" data-index="${index}">−</button>
        <button class="btn btn-sm btn-outline-secondary me-1 qty-increase" data-index="${index}">+</button>
        <button class="btn btn-sm btn-danger remove-item" data-index="${index}">🗑</button>
      </div>
    `;
    cartList.appendChild(li);
  });

  totalDisplay.textContent = total;

  document.querySelectorAll('.qty-decrease').forEach(btn =>
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.index), -1))
  );

  document.querySelectorAll('.qty-increase').forEach(btn =>
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.index), 1))
  );

  document.querySelectorAll('.remove-item').forEach(btn =>
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.index)))
  );
}

async function placeOrder() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  try {
    const res = await fetch('/seller/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ cart })
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Order placed successfully!');
      cart = [];
      renderCart();
      location.reload();
    } else {
      alert(data.message || '❌ Order failed');
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("❌ Something went wrong!");
  }
}

// Menu JSON URL
const menuUrl = './menu.json';

// WhatsApp Configuration (Update this with your phone number)
const WHATSAPP_CONFIG = {
  enabled: true,  // Admin controls this in script.js
  phone: '919000000000', // Replace with your WhatsApp number
  countryCode: '+91'
};

// Store menu items globally for order modal
let currentMenuItems = [];

// Format price with rupee symbol
function formatPrice(price) {
  return `₹${price}`;
}

// Create a gray SVG placeholder (works offline, no external URL)
function getPlaceholderSVG() {
  return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b7280%22 font-family=%22system-ui%22 font-size=%2218%22 font-weight=%22600%22%3EMenu Item%3C/text%3E%3C/svg%3E';
}

// Create a menu card element from item data with tags, image placeholder, and WhatsApp CTA
function createCard(item) {
  const safeName = item.name || '';
  const safeDesc = item.desc || '';
  const safeCategory = (item.category || '').toLowerCase();
  const safeRating = item.rating || '';
  const safePrice = item.price || 0;
  const safeTags = Array.isArray(item.tags) ? item.tags : [];

  // Use provided image or SVG placeholder
  const imageSrc = (item.image && item.image.trim() !== '') ? item.image : getPlaceholderSVG();

  // Badge HTML for tags (New, Popular, etc)
  const tagBadges = safeTags.map(tag => {
    const t = String(tag).toLowerCase();
    let color = 'bg-emerald-100 text-emerald-700';
    let label = tag;

    if (t === 'new') {
      color = 'bg-rose-100 text-rose-700';
      label = '✨ New';
    } else if (t === 'popular') {
      color = 'bg-amber-100 text-amber-700';
      label = '⭐ Popular';
    } else if (t === 'bestseller') {
      color = 'bg-purple-100 text-purple-700';
      label = '🔥 Bestseller';
    }

    return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${color}">${label}</span>`;
  }).join(' ');

  return `
    <article class="menu-card rounded-2xl shadow-lg overflow-hidden scale-in bg-white/90 backdrop-blur hover:shadow-xl transition-shadow duration-300 flex flex-col" data-cat="${safeCategory}" data-name="${safeName.toLowerCase()}" data-price="${safePrice}" data-item-name="${safeName}">
      <div class="relative overflow-hidden h-48 flex-shrink-0">
        <img src="${imageSrc}" loading="lazy" decoding="async" class="w-full h-full object-cover lazy-img" alt="${safeName}" onerror="this.src='${getPlaceholderSVG()}'">
        <div class="absolute top-3 right-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          ⭐ ${safeRating}
        </div>
        ${tagBadges ? `<div class="absolute left-3 top-3 flex gap-1 flex-wrap">${tagBadges}</div>` : ''}
      </div>
      <div class="p-4 flex flex-col gap-3 flex-grow">
        <div class="flex-grow">
          <h3 class="font-bold text-lg mb-1 card-title line-clamp-2 text-slate-900">${safeName}</h3>
          <p class="text-gray-600 text-sm card-desc line-clamp-2">${safeDesc}</p>
        </div>
        <!-- PRICE DISPLAY WITH CUSTOM CSS CLASS -->
        <div class="card-price-section">
          <span class="card-price-text">${formatPrice(safePrice)}</span>
        </div>
        <!-- ORDER BUTTON - VISIBLE ONLY WHEN ENABLED -->
        ${WHATSAPP_CONFIG.enabled ? `
        <button class="order-card-btn w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 mt-2 text-sm">
          Tap to Order
        </button>
        ` : ''}
      </div>
    </article>
  `;
}

// Load menu from JSON and render cards
async function loadMenu() {
  try {
    const response = await fetch(menuUrl);
    if (!response.ok) {
      throw new Error(`Failed to load menu: ${response.statusText}`);
    }
    const items = await response.json();
    currentMenuItems = items;
    
    const grid = document.querySelector('#menuGrid');
    if (!grid) {
      console.error('Menu grid container not found');
      return;
    }

    // Clear existing content
    grid.innerHTML = '';

    // Create and render all cards
    items.forEach(item => {
      grid.innerHTML += createCard(item);
    });

    console.log(`✅ Loaded ${items.length} menu items`);

    // Display daily specials (items with special: true)
    const specials = items.filter(i => i.special === true).slice(0, 5);
    const specialsBar = document.getElementById('specialsBar');
    const specialsList = document.getElementById('specialsList');

    if (specialsBar && specialsList && specials.length > 0) {
      specialsBar.classList.remove('hidden');
      specialsList.innerHTML = specials.map(sp => `
        <span class="inline-flex items-center rounded-full bg-white/80 px-3 py-1 shadow-sm text-[12px] font-bold text-amber-900">
          ${sp.name} - ${formatPrice(sp.price)}
        </span>
      `).join('');
    }

    // Attach filter click handlers after cards are created
    attachFilterHandlers();
    attachOrderButtonHandlers();

  } catch (error) {
    console.error('Error loading menu:', error);
    const grid = document.querySelector('#menuGrid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: red; padding: 40px 20px;">
          <p style="font-size: 18px; font-weight: bold;">❌ Failed to load menu</p>
          <p style="font-size: 14px; margin-top: 8px; color: #666;">Please make sure menu.json exists in the same folder</p>
        </div>
      `;
    }
  }
}

// Attach order button handlers
function attachOrderButtonHandlers() {
  const orderButtons = document.querySelectorAll('.order-card-btn');
  orderButtons.forEach(btn => {
    btn.removeEventListener('click', handleOrderButtonClick);
    btn.addEventListener('click', handleOrderButtonClick);
  });
}

// Handle order button click
function handleOrderButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  // Check if WhatsApp is enabled
  if (!WHATSAPP_CONFIG.enabled) {
    Swal.fire({
      icon: 'error',
      title: 'Ordering Disabled',
      text: 'WhatsApp ordering is currently not available. Please try again later.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK'
    });
    return;
  }

  const card = this.closest('.menu-card');
  const itemName = card.getAttribute('data-item-name');
  const itemPrice = parseFloat(card.getAttribute('data-price'));

  openOrderModal(itemName, itemPrice);
}

// Open order modal
function openOrderModal(itemName, itemPrice) {
  const modal = document.getElementById('orderModal');
  const backdrop = document.getElementById('orderModalBackdrop');
  const modalBox = document.querySelector('.order-modal-box');
  
  // Set product info
  document.getElementById('orderModalProductName').textContent = itemName;
  document.getElementById('orderModalProductPrice').textContent = formatPrice(itemPrice);
  
  // Reset quantity
  document.getElementById('orderModalQuantity').value = '1';
  document.getElementById('orderModalTableNumber').value = '';
  document.getElementById('orderModalSpecialInstructions').value = '';
  
  // Update total
  updateOrderTotal(itemPrice);
  
  // Show modal - remove inert and set aria-hidden to false
  modal.removeAttribute('inert');
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.remove('order-modal-hidden');
  modal.classList.add('order-modal-visible');
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.style.opacity = '1';
  backdrop.style.pointerEvents = 'auto';
  modalBox.style.transform = 'scale(1)';
  document.body.style.overflow = 'hidden';
}

// Close order modal
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  const backdrop = document.getElementById('orderModalBackdrop');
  const modalBox = document.querySelector('.order-modal-box');
  
  // Hide modal - add inert and set aria-hidden to true
  modal.setAttribute('inert', '');
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('order-modal-visible');
  modal.classList.add('order-modal-hidden');
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.style.opacity = '0';
  backdrop.style.pointerEvents = 'none';
  modalBox.style.transform = 'scale(0.95)';
  document.body.style.overflow = '';
}

// Update order total
function updateOrderTotal(basePrice) {
  const quantity = parseInt(document.getElementById('orderModalQuantity').value) || 1;
  const total = basePrice * quantity;
  document.getElementById('orderModalTotal').textContent = formatPrice(total);
}

// Show/hide menu items by category
function showCategory(category) {
  const cards = document.querySelectorAll('[data-cat]');
  let visibleCount = 0;

  cards.forEach(card => {
    const cardCategory = card.getAttribute('data-cat');
    const isMatch = (category === 'all') || (cardCategory === category);
    
    if (isMatch) {
      card.style.display = 'block';
      card.classList.add('fade-in');
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.classList.remove('fade-in');
    }
  });

  // Update active button state for ALL filter buttons
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    const btnCategory = btn.getAttribute('data-filter');
    if (btnCategory === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Clear search when changing category
  const searchInput = document.getElementById('menuSearch');
  if (searchInput) {
    searchInput.value = '';
  }

  console.log(`🔍 Filtered: ${category} | Showing ${visibleCount} items`);
}

// Attach click handlers to filter buttons
function attachFilterHandlers() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  
  filterButtons.forEach(btn => {
    btn.removeEventListener('click', handleFilterClick);
    btn.addEventListener('click', handleFilterClick);
  });
}

// Filter button click handler
function handleFilterClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const category = this.getAttribute('data-filter');
  console.log(`📌 Filter clicked: ${category}`);
  showCategory(category);
}

// Simple name-based search filter
function applySearchFilter() {
  const searchInput = document.getElementById('menuSearch');
  const clearBtn = document.getElementById('clearSearch');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const cards = document.querySelectorAll('[data-name]');

  // Show/hide clear button
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !query);
  }

  let visibleCount = 0;

  cards.forEach(card => {
    const name = card.getAttribute('data-name') || '';
    const matches = !query || name.includes(query);
    
    if (matches) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  console.log(`🔎 Search: "${query}" | Found ${visibleCount} items`);
}

// Clear search input
function clearSearch() {
  const searchInput = document.getElementById('menuSearch');
  if (searchInput) {
    searchInput.value = '';
    applySearchFilter();
    searchInput.focus();
  }
}

// Scroll to top functionality
function setupScrollToTop() {
  const scrollBtn = document.getElementById('scrollToTopBtn');
  
  if (!scrollBtn) return;

  // Show/hide button on scroll
  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
      scrollBtn.classList.remove('hidden');
      scrollBtn.classList.add('active');
    } else {
      scrollBtn.classList.remove('active');
      scrollBtn.classList.add('hidden');
    }
  });

  // Scroll to top on click
  scrollBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Bytes & Spicy menu application...');
  loadMenu();
  setupScrollToTop();
  setupOrderModal();
  
  // Attach handlers to filter buttons
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });

  // Attach search handler
  const searchInput = document.getElementById('menuSearch');
  if (searchInput) {
    searchInput.addEventListener('input', applySearchFilter);
  }

  // Attach clear button handler
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearSearch);
  }

  // Show all items by default
  showCategory('all');
});

// Order Modal Setup
function setupOrderModal() {
  const modalCancel = document.getElementById('orderModalCancel');
  const modalSubmit = document.getElementById('orderModalSubmit');
  const qtyMinus = document.getElementById('orderModalQtyMinus');
  const qtyPlus = document.getElementById('orderModalQtyPlus');
  const qtyInput = document.getElementById('orderModalQuantity');
  const backdrop = document.getElementById('orderModalBackdrop');

  if (!modalCancel) return;

  // Cancel button
  modalCancel.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeOrderModal();
  });
  
  // Backdrop click
  backdrop.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeOrderModal();
  });

  // Quantity controls
  if (qtyMinus) {
    qtyMinus.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const current = parseInt(qtyInput.value) || 1;
      if (current > 1) {
        qtyInput.value = current - 1;
        updateOrderTotalFromInput();
      }
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const current = parseInt(qtyInput.value) || 1;
      qtyInput.value = current + 1;
      updateOrderTotalFromInput();
    });
  }

  if (qtyInput) {
    qtyInput.addEventListener('change', updateOrderTotalFromInput);
    qtyInput.addEventListener('input', updateOrderTotalFromInput);
  }

  // Submit button
  if (modalSubmit) {
    modalSubmit.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      submitOrder();
    });
  }

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeOrderModal();
    }
  });
}

// Update order total from input
function updateOrderTotalFromInput() {
  const priceTxt = document.getElementById('orderModalProductPrice').textContent;
  const price = parseFloat(priceTxt.replace('₹', ''));
  updateOrderTotal(price);
}

// Submit order
function submitOrder() {
  const productName = document.getElementById('orderModalProductName').textContent;
  const tableNumber = document.getElementById('orderModalTableNumber').value.trim();
  const quantity = parseInt(document.getElementById('orderModalQuantity').value) || 1;
  const instructions = document.getElementById('orderModalSpecialInstructions').value.trim();
  const priceTxt = document.getElementById('orderModalProductPrice').textContent;
  const price = parseFloat(priceTxt.replace('₹', ''));
  const total = price * quantity;

  // Validate table number
  if (!tableNumber) {
    Swal.fire({
      icon: 'error',
      title: 'Missing Table Number',
      text: 'Please enter your table number to proceed with the order.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Format WhatsApp message
  const waMessage = formatWhatsAppMessage(productName, quantity, price, total, tableNumber, instructions);
  
  // Send to WhatsApp
  sendToWhatsApp(waMessage);
  
  // Show success
  Swal.fire({
    icon: 'success',
    title: 'Order Sent Successfully! 🎉',
    text: `Your order for ${productName} has been sent via WhatsApp`,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK'
  }).then(() => {
    closeOrderModal();
  });
}

// Format WhatsApp message
function formatWhatsAppMessage(productName, quantity, price, total, tableNumber, instructions) {
  let message = ` Order from Bytes & Spicy\n\n`;
  message += ` Product: ${productName}\n`;
  message += ` Quantity: ${quantity}\n`;
  message += ` Price per item: ₹${price}\n`;
  message += ` Total: ₹${total}\n`;
  message += ` Table Number: ${tableNumber}\n`;
  
  if (instructions) {
    message += `Special Instructions: ${instructions}\n`;
  }
  
  message += `\n Please confirm this order. Thank you! `;
  
  return message;
}

// Send to WhatsApp
function sendToWhatsApp(message) {
  if (!WHATSAPP_CONFIG.phone || WHATSAPP_CONFIG.phone === '919000000000') {
    Swal.fire({
      icon: 'error',
      title: 'Configuration Error',
      text: 'WhatsApp number has not been configured. Please contact the restaurant admin.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK'
    });
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_CONFIG.phone}?text=${encodedMessage}`;
  
  // Open WhatsApp
  window.open(whatsappUrl, '_blank');
}

// Hero video scroll effect
window.addEventListener('scroll', function() {
  const heroHeader = document.getElementById('heroHeader');
  if (!heroHeader) return;

  const scrollTop = window.scrollY;
  const heroHeight = heroHeader.offsetHeight;

  if (scrollTop > heroHeight * 0.3) {
    heroHeader.classList.add('scrolled');
  } else {
    heroHeader.classList.remove('scrolled');
  }

  // Menu card animation on scroll
  const cards = document.querySelectorAll('.menu-card');
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    if (rect.top < windowHeight * 0.75 && !card.classList.contains('slide-up')) {
      card.classList.add('slide-up');
    }
  });
}, false);

// Footer toggle (show/hide panel) and overlay handling with enhanced UX
document.addEventListener('DOMContentLoaded', function() {
  const scrollBtn = document.getElementById('scrollToFooterBtn');
  const footer = document.getElementById('footerSection');
  const overlay = document.getElementById('footerOverlay');
  const icon = document.getElementById('scrollBtnIcon');
  const label = document.getElementById('scrollBtnLabel');
  const footerCloseBtn = document.getElementById('footerCloseBtn');

  if (!scrollBtn || !footer || !overlay) return;

  // Helper function to close footer
  function closeFooter() {
    footer.classList.remove('footer-visible');
    overlay.classList.remove('visible');
    document.body.classList.remove('overflow-hidden');
    scrollBtn.setAttribute('aria-expanded', 'false');
    if (icon) icon.textContent = '↓';
    if (label) label.textContent = 'Open';
  }

  // Helper function to open footer
  function openFooter() {
    footer.classList.add('footer-visible');
    overlay.classList.add('visible');
    document.body.classList.add('overflow-hidden');
    scrollBtn.setAttribute('aria-expanded', 'true');
    if (icon) icon.textContent = '↑';
    if (label) label.textContent = 'Close';
    // Smooth scroll footer content to top
    footer.scrollTop = 0;
  }

  // Toggle footer panel visibility via button click
  scrollBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = footer.classList.contains('footer-visible');
    if (isOpen) {
      closeFooter();
    } else {
      openFooter();
    }
  });

  // Close footer via close button (mobile)
  if (footerCloseBtn) {
    footerCloseBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeFooter();
    });
  }

  // Clicking overlay closes the footer with smooth animation
  overlay.addEventListener('click', function(e) {
    e.stopPropagation();
    closeFooter();
  });

  // ESC key closes the footer (accessibility feature)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && footer.classList.contains('footer-visible')) {
      closeFooter();
    }
  });

  // Prevent overlap issues on touch devices
  document.addEventListener('touchmove', function(e) {
    if (document.body.classList.contains('overflow-hidden')) {
      e.preventDefault();
    }
  }, { passive: false });

}, false);

// Service Worker Registration (for offline support)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').then(function(registration) {
      console.log('✅ Service Worker registered:', registration);
    }).catch(function(error) {
      console.log('⚠️ Service Worker registration failed:', error);
    });
  });
}

// Lazy Loading for images (for browsers that don't support native loading="lazy")
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('.lazy-img').forEach(img => imageObserver.observe(img));
}

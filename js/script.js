// Menu JSON URL
const menuUrl = './menu.json';

// Format price with rupee symbol
function formatPrice(price) {
  return `₹${price}`;
}

// Create a menu card element from item data
function createCard(item) {
  return `
    <article class="menu-card rounded-2xl shadow-lg overflow-hidden scale-in" data-cat="${item.category}">
      <div class="relative overflow-hidden h-48">
        <img src="${item.image}" loading="lazy" class="w-full h-full object-cover" alt="${item.name}">
        <div class="absolute top-3 right-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">⭐ ${item.rating}</div>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-lg mb-2 card-title">${item.name}</h3>
        <p class="text-gray-600 text-sm mb-4 card-desc">${item.desc}</p>
        <span class="price-tag font-bold text-xl">${formatPrice(item.price)}</span>
      </div>
    </article>
  `;
}

// Load menu from JSON and render cards
async function loadMenu() {
  try {
    const response = await fetch(menuUrl);
    if (!response.ok) throw new Error(`Failed to load menu: ${response.statusText}`);
    
    const items = await response.json();
    const grid = document.querySelector('#menuGrid');
    
    if (grid) {
      grid.innerHTML = items.map(createCard).join('');
      console.log(`✓ Loaded ${items.length} menu items`);
    }
  } catch (error) {
    console.error('Error loading menu:', error);
    const grid = document.querySelector('#menuGrid');
    if (grid) {
      grid.innerHTML = '<p style="color: red; grid-column: 1/-1;">Failed to load menu. Please serve via a local server.</p>';
    }
  }
}

// Show/hide menu items by category using data attributes
function showCategory(cat) {
  // Get all menu cards with data-cat attribute
  const cards = document.querySelectorAll('[data-cat]');
  
  cards.forEach(card => {
    const cardCategory = card.getAttribute('data-cat');
    const isMatch = (cat === 'all') || (cardCategory === cat);
    
    // Show/hide based on category match
    card.style.display = isMatch ? '' : 'none';
    if (isMatch) {
      card.classList.add('fade-in');
    } else {
      card.classList.remove('fade-in');
    }
  });

  // Update active button state using data attribute
  const buttons = document.querySelectorAll('[data-filter]');
  buttons.forEach(btn => {
    const btnCategory = btn.getAttribute('data-filter');
    btn.classList.toggle('active', btnCategory === cat);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadMenu();
  showCategory('all');
  
  // Add click handlers to filter buttons using data attributes
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const category = this.getAttribute('data-filter');
      showCategory(category);
    });
  });
});

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
  
  // Simple, smooth menu card animation on scroll
  const cards = document.querySelectorAll('.menu-card');
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    if (rect.top < windowHeight * 0.75 && !card.classList.contains('slide-up')) {
      card.classList.add('slide-up');
    }
  });
}, false);

// Footer toggle (show/hide panel) and overlay handling
document.addEventListener('DOMContentLoaded', function() {
  const scrollBtn = document.getElementById('scrollToFooterBtn');
  const footer = document.getElementById('footerSection');
  const overlay = document.getElementById('footerOverlay');
  const icon = document.getElementById('scrollBtnIcon');
  const label = document.getElementById('scrollBtnLabel');

  if (!scrollBtn || !footer || !overlay) return;

  // Toggle footer panel visibility
  scrollBtn.addEventListener('click', function() {
    const isOpen = footer.classList.toggle('footer-visible');
    overlay.classList.toggle('visible', isOpen);
    document.body.classList.toggle('overflow-hidden', isOpen);
    scrollBtn.setAttribute('aria-expanded', String(isOpen));
    if (icon) icon.textContent = isOpen ? '↑' : '↓';
    if (label) label.textContent = isOpen ? 'Close' : 'Open';
  });

  // Clicking overlay closes the footer
  overlay.addEventListener('click', function() {
    footer.classList.remove('footer-visible');
    overlay.classList.remove('visible');
    document.body.classList.remove('overflow-hidden');
    scrollBtn.setAttribute('aria-expanded', 'false');
    if (icon) icon.textContent = '↓';
    if (label) label.textContent = 'Open';
  });
}, false);
    
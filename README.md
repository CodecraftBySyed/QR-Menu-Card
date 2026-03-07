# 🚀 Bytes & Spicy --- Digital QR Menu System

**Modern · Mobile‑First · Static · Café‑Ready**

A lightweight **QR Menu & WhatsApp Ordering System** built with **HTML,
Tailwind CSS, and JavaScript**.\
Designed for cafés and small restaurants that want a **fast, hygienic,
and modern menu experience** without servers or databases.

Customers simply **scan a QR code → open the menu → place an order**.

------------------------------------------------------------------------

# 🌟 Project Story

One evening I visited a café and picked up their menu.

It looked **old, faded, and unhygienic**.

At that moment I thought:

> "Menus should be digital. Why not build a QR-based experience?"

So this project was created.

**Scan → Menu opens instantly**

• No mobile app\
• No backend server\
• Works on any smartphone\
• Simple and fast

------------------------------------------------------------------------

# 🔥 Core Features

### 📱 Mobile‑First Design

Responsive layout built using **Tailwind CSS**.

### 🍽 Dynamic Menu

Menu items loaded from **menu.json** for easy updates.

### 🔍 Smart Navigation

-   Category filters
-   Menu search
-   Specials section

### ⚡ Static Hosting Ready

Works on:

-   Netlify
-   GitHub Pages
-   Vercel
-   Any static host

No backend required.

------------------------------------------------------------------------

# 🛒 Ordering System (Pro Mode)

When ordering is enabled, the system becomes a **full QR ordering
interface**.

Features:

• Item popup ordering modal\
• Quantity selector\
• Special instructions\
• Table auto detection\
• Lightweight cart system\
• Live cart counter\
• WhatsApp checkout

Customers can **add multiple items to cart and send a single order**.

------------------------------------------------------------------------

# 🔄 Basic vs Pro Mode

The project supports **two modes using a feature flag**.

## Basic Mode

``` javascript
WHATSAPP_ORDER_ENABLED = false
```

Menu browsing only.

## Pro Mode

``` javascript
WHATSAPP_ORDER_ENABLED = true
```

Cart + WhatsApp ordering enabled.

------------------------------------------------------------------------

# 📱 Table Detection

Each QR code contains a table parameter.

Example:

    https://domain.com/menu?table=5

The system:

1.  Detects the table number
2.  Saves it in localStorage
3.  Includes it in the order message

Example order:

    🧾 New Order

    Table: 5
    ☕ Chai x2
    🍪 Biscuit x1
    Notes: Less sugar

------------------------------------------------------------------------

# 🧺 Cart System

Cart stored in **localStorage**.

Example structure:

``` json
[
  { "name": "Chai", "qty": 2 },
  { "name": "Coffee", "qty": 1 }
]
```

Features:

• Quantity controls\
• Live cart counter\
• Remove items\
• Scrollable cart modal

------------------------------------------------------------------------

# 📦 WhatsApp Checkout

At checkout the system generates a message and opens:

    https://wa.me/restaurantNumber?text=orderDetails

After sending the order the cart is cleared.

------------------------------------------------------------------------

# 🔳 QR Generator

Location:

    /routes/qr-generator/

Features:

• Generate table QR codes\
• Embed café logo\
• High resolution PNG export\
• Mobile responsive preview\
• Bulk QR generation\
• ZIP download

Example QR URL:

    /menu?table=5

------------------------------------------------------------------------

# 🛠 Tech Stack

Frontend only:

• HTML5\
• Tailwind CSS\
• JavaScript\
• SweetAlert2\
• qr-code-styling

Optional:

• Service Worker for offline caching

------------------------------------------------------------------------

# 📁 Project Structure

    Bytes-And-Spicy/
    │
    ├── index.html
    ├── menu.json
    │
    ├── js/
    │   └── script.js
    │
    ├── src/
    │   └── style.css
    │
    ├── images/
    │
    ├── video/
    │
    ├── routes/
    │   └── qr-generator/
    │
    └── service-worker.js

------------------------------------------------------------------------

# ⚡ Performance Optimizations

• Lazy loaded images\
• Service worker caching\
• Cached menu price lookups\
• Shared SweetAlert helper functions

------------------------------------------------------------------------

# 🚀 Future Improvements

Possible upgrades:

• Printable table QR cards\
• Admin configuration panel\
• Order dashboard\
• Multi‑restaurant support

------------------------------------------------------------------------

# 🌐 Live Demo

https://qr-menu-card.netlify.app/

Developer Portfolio:

https://codecraftbysyed-portfolio.vercel.app/

------------------------------------------------------------------------

# 📄 License

MIT License

------------------------------------------------------------------------

# ❤️ Author

Created by **CodeCraft by Syed**

A small café idea turned into a **real QR menu system**.

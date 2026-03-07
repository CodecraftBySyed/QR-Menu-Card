const assert = require('assert');
const { buildWhatsAppMessage } = require('./orderMessageBuilder');

function buildFromCartCheckout(input) {
  return buildWhatsAppMessage(input);
}

function buildFromQuickCheckout(input) {
  return buildWhatsAppMessage(input);
}

function run() {
  {
    const input = {
      orderNumber: '100001',
      tableNumber: '5',
      order: {
        items: [
          { name: 'Chai', qty: 2, unitPrice: 20 },
          { name: 'Coffee', qty: 1, unitPrice: 60 }
        ],
        discount: { type: 'percent', value: 10 },
        deliveryFee: 0,
        taxes: 5
      },
      specialInstructions: 'Less sugar'
    };

    const a = buildFromCartCheckout(input);
    const b = buildFromQuickCheckout(input);
    assert.strictEqual(a, b);
    assert.ok(a.includes('Bytes & Spicy - Premium Menu'));
    assert.ok(a.includes('table number 5'));
    assert.ok(a.includes('Order Items'));
    assert.ok(a.includes('Chai × 2 = ₹ 40'));
    assert.ok(a.includes('Total: ₹ 95'));
    assert.ok(a.includes('Special Instructions: Less sugar'));
    assert.ok(a.includes('take the order to confirm ok'));
  }

  {
    const input = {
      orderNumber: '100002',
      tableNumber: '3',
      order: {
        items: [
          { name: 'Biscuit', qty: 1, unitPrice: 10 }
        ],
        discount: { type: 'flat', value: 0 },
        deliveryFee: 0,
        taxes: 0
      },
      specialInstructions: 'No ice'
    };

    const a = buildFromCartCheckout(input);
    const b = buildFromQuickCheckout(input);
    assert.strictEqual(a, b);
    assert.ok(a.includes('Total: ₹ 10'));
    assert.ok(a.includes('take the order to confirm ok'));
  }

  {
    const input = {
      orderNumber: '100003',
      tableNumber: '1',
      order: {
        items: [
          { name: 'Chai', qty: 1, unitPrice: 20 }
        ],
        discount: { type: 'flat', value: 0 },
        deliveryFee: 0,
        taxes: 0
      },
      specialInstructions: ''
    };

    const a = buildFromCartCheckout(input);
    const b = buildFromQuickCheckout(input);
    assert.strictEqual(a, b);
    assert.ok(!a.includes('Special Instructions:'));
    assert.ok(a.includes('take the order to confirm ok'));
  }

  console.log('✅ orderMessageBuilder tests passed');
}

run();

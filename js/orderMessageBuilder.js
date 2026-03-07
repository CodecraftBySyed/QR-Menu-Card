(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.OrderMessageBuilder = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function toNumber(value) {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatRupees(amount) {
    const n = toNumber(amount);
    const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.00$/, '');
    return `₹ ${str}`;
  }

  function calculateTotals(order) {
    const items = Array.isArray(order && order.items) ? order.items : [];
    const deliveryFee = toNumber(order && order.deliveryFee);
    const taxes = toNumber(order && order.taxes);

    const lineItems = items.map((it) => {
      const name = String((it && it.name) || '').trim();
      const qty = Math.max(0, parseInt(it && it.qty, 10) || 0);
      const unitPrice = toNumber(it && it.unitPrice);
      const lineTotal = qty * unitPrice;
      return { name, qty, unitPrice, lineTotal };
    }).filter(li => li.name && li.qty > 0);

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);

    const discountInput = order && order.discount;
    let discountAmount = 0;
    if (discountInput && typeof discountInput === 'object') {
      const type = String(discountInput.type || '').toLowerCase();
      const value = toNumber(discountInput.value);
      if (type === 'percent') {
        discountAmount = subtotal * (value / 100);
      } else if (type === 'flat') {
        discountAmount = value;
      } else if ('amount' in discountInput) {
        discountAmount = toNumber(discountInput.amount);
      }
    } else {
      discountAmount = toNumber(order && order.discountAmount);
    }

    if (discountAmount < 0) discountAmount = 0;
    if (discountAmount > subtotal) discountAmount = subtotal;

    const grandTotal = subtotal - discountAmount + deliveryFee + taxes;

    return {
      lineItems,
      subtotal,
      discountAmount,
      deliveryFee,
      taxes,
      grandTotal
    };
  }

  function buildWhatsAppMessage(params) {
    const tableNumber = String((params && params.tableNumber) || '').trim();
    const order = params && params.order ? params.order : {};
    const specialInstructions = String((params && params.specialInstructions) || '').trim();

    const totals = calculateTotals(order);

    const lines = [];
    lines.push('Bytes & Spicy - Premium Menu');
    lines.push(tableNumber ? `table number ${tableNumber}` : 'table number');
    lines.push('');
    lines.push('Order Items');

    totals.lineItems.forEach((li) => {
      lines.push(`${li.name} × ${li.qty} = ${formatRupees(li.lineTotal)}`);
    });

    lines.push('');
    lines.push(`Total: ${formatRupees(totals.grandTotal)}`);
    if (specialInstructions) lines.push(`Special Instructions: ${specialInstructions}`);
    lines.push('take the order to confirm ok');

    return lines.join('\n');
  }

  return {
    calculateTotals,
    buildWhatsAppMessage
  };
});

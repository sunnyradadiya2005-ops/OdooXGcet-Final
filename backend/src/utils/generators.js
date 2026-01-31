import { v4 as uuidv4 } from 'uuid';

export function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
}

export function generateQuoteNumber() {
  return `QUO-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
}

export function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
}

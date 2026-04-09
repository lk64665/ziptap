// src/data/products.js
export const PRODUCTS = [
  { id:'1',  name:'Organic Whole Milk 1L',   price:85,  mrp:110, category:'Dairy',     discount:23, restocked:false, barcode:'8901234567890' },
  { id:'2',  name:'Whole Wheat Bread',        price:45,  mrp:55,  category:'Bakery',    discount:18, restocked:false, barcode:'8901234567891' },
  { id:'3',  name:'Free Range Eggs 12pk',     price:120, mrp:120, category:'Fresh',     discount:0,  restocked:true,  barcode:'8901234567892' },
  { id:'4',  name:'Fresh Tomatoes 500g',      price:38,  mrp:50,  category:'Produce',   discount:24, restocked:false, barcode:'8901234567893' },
  { id:'5',  name:'Greek Yogurt 200g',        price:65,  mrp:80,  category:'Dairy',     discount:19, restocked:false, barcode:'8901234567894' },
  { id:'6',  name:'Orange Juice 1L',          price:75,  mrp:75,  category:'Beverages', discount:0,  restocked:true,  barcode:'8901234567895' },
  { id:'7',  name:'Dark Chocolate Bar',       price:55,  mrp:70,  category:'Snacks',    discount:21, restocked:false, barcode:'8901234567896' },
  { id:'8',  name:'Basmati Rice 1kg',         price:95,  mrp:120, category:'Grains',    discount:21, restocked:true,  barcode:'8901234567897' },
  { id:'9',  name:'Cold Brew Coffee 250ml',   price:89,  mrp:110, category:'Beverages', discount:19, restocked:false, barcode:'8901234567898' },
  { id:'10', name:'Multigrain Biscuits 200g', price:35,  mrp:45,  category:'Snacks',    discount:22, restocked:false, barcode:'8901234567899' },
];

export const CATEGORY_COLORS = {
  Dairy:     { bg:'#e0f2fe', text:'#0369a1' },
  Bakery:    { bg:'#fef9c3', text:'#a16207' },
  Fresh:     { bg:'#dcfce7', text:'#15803d' },
  Produce:   { bg:'#fee2e2', text:'#dc2626' },
  Beverages: { bg:'#dbeafe', text:'#1d4ed8' },
  Snacks:    { bg:'#fce7f3', text:'#db2777' },
  Grains:    { bg:'#fef3c7', text:'#d97706' },
};

export const PROMO_SLIDES = [
  { productId:'1', type:'deal',    bg:'#2D1B69', accent:'#A78BFA' },
  { productId:'4', type:'deal',    bg:'#7f1d1d', accent:'#fca5a5' },
  { productId:'3', type:'restock', bg:'#1e3a5f', accent:'#93c5fd' },
  { productId:'7', type:'deal',    bg:'#3b1a4a', accent:'#e879f9' },
  { productId:'8', type:'restock', bg:'#422006', accent:'#fbbf24' },
  { productId:'9', type:'deal',    bg:'#1a2e5f', accent:'#38bdf8' },
];

export const CONVENIENCE_FEE = 15;
export const GST_RATE        = 0.05;

export function calcSubtotal(items) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}
export function calcTax(sub)   { return Math.round(sub * GST_RATE); }
export function calcTotal(sub) { return sub + calcTax(sub) + CONVENIENCE_FEE; }
// ₹100 spent → 10 Z-Coins
export function calcZCoins(total) { return Math.floor(total / 100) * 10; }

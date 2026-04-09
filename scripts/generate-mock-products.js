/**
 * Generates ../products.json (500 items) and ../barcodes_list.txt (first 20).
 * Run: node scripts/generate-mock-products.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'products.json');
const OUT_TXT = path.join(ROOT, 'barcodes_list.txt');

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Realistic Indian grocery names per category (pooled, shuffled for variety) */
const NAME_POOL = {
  Dairy: [
    'Amul Gold Milk 1L', 'Amul Taaza Milk 500ml', 'Mother Dairy Full Cream 1L',
    'Nestlé Everyday Dairy Whitener 400g', 'Amul Butter 100g', 'Amul Paneer 200g',
    'Britannia Cheese Slices 200g', 'Mother Dairy Dahi 400g', 'Amul Masti Dahi 400g',
    'Amul Ghee 500ml', 'Nandini Ghee 500ml', 'Verka Lassi 200ml',
    'Epigamia Greek Yogurt 90g', 'Milky Mist Curd 500g', 'Amul Lassi Mango 200ml',
    'Britannia Cheese Spread 180g', 'Amul Fresh Cream 250ml', 'Mother Dairy Buttermilk 200ml',
    'Nestlé Milkmaid 400g', 'Amul Mithai Mate 400g', 'Britannia Cubes Cheese 200g',
  ],
  Snacks: [
    'Maggi 2-Minute Noodles 70g', 'Maggi Masala-ae-Magic 72g', 'Yippee Noodles 60g',
    'Lays Classic Salted 52g', "Lay's Magic Masala 52g", 'Kurkure Masala Munch 90g',
    'Bingo Mad Angles 72g', 'Haldiram Bhujia 400g', 'Haldiram Moong Dal 200g',
    'Bikaji Bikaneri Bhujia 1kg', 'Parle-G 800g Family Pack', 'Britannia Good Day 200g',
    'Sunfeast Dark Fantasy Choco 150g', 'Cadbury Dairy Milk Silk 60g', 'Cadbury Bournville 80g',
    'Uncle Chips Spicy Treat 55g', 'Too Yumm Multigrain Chips 60g', 'Act II Popcorn Butter 70g',
    'Britannia Treat Croissant 50g', 'Parle Monaco 200g', 'Britannia 50-50 150g',
    'Haldiram Aloo Bhujia 200g', 'Bikaji Soan Papdi 500g', 'Nutraj California Almonds 200g',
  ],
  Staples: [
    'Patanjali Atta 5kg', 'Patanjali Atta 10kg', 'Aashirvaad Superior Atta 5kg',
    'Aashirvaad Atta 10kg', 'Fortune Chakki Fresh Atta 5kg', 'Fortune Soya Health Oil 1L',
    'Fortune Mustard Oil 1L', 'Fortune Besan 500g', 'Fortune Arhar Dal 1kg',
    'Tata Sampann Unpolished Toor Dal 1kg', 'Tata Sampann Moong Dal 500g',
    'India Gate Basmati Rice 5kg', 'Daawat Basmati Rice 1kg', 'Fortune Biryani Rice 1kg',
    'Patanjali Cow Ghee 500ml', 'Mother Dairy Cow Ghee 200ml', 'Fortune Maida 1kg',
    'Patanjali Suji 500g', 'Rajdhani Chana Dal 500g', 'Tata Salt 1kg', 'Madhur Sugar 5kg',
    'Dhampure Sulphurless Sugar 1kg', 'Fortune Kabuli Chana 500g', 'Patanjali Rajma 1kg',
  ],
  Beverages: [
    'Red Label Tea 250g', 'Taj Mahal Tea 500g', 'Tata Tea Gold 250g',
    'Nescafé Classic Coffee 50g', 'Nescafé Sunrise 200g', 'Bru Instant Coffee 100g',
    'Real Fruit Juice Mango 1L', 'Maaza Mango Drink 600ml', 'Slice Mango 600ml',
    'Sprite 750ml PET', 'Thums Up 750ml', 'Coca-Cola 750ml',
    'Kinley Water 1L', 'Bisleri Water 1L', 'Paper Boat Aam Panna 250ml',
    'Tropicana Mixed Fruit 1L', 'Appy Fizz 250ml', 'Sting Energy 250ml',
    'Monster Energy 350ml', 'Red Bull 250ml', 'Bournvita 500g', 'Horlicks Classic 500g',
  ],
  Bakery: [
    'Britannia Whole Wheat Bread 450g', 'Britannia Brown Bread 400g', 'Modern Sandwich Bread 400g',
    'Britannia Fruit Cake 150g', 'Britannia Rusk 200g', 'Britannia Marie Gold 250g',
    'Sunfeast Mom\'s Magic 200g', 'Britannia Nice Time 150g', 'Parle Hide & Seek 120g',
    'Britannia Treat Croissant Chocolate 45g', 'English Oven Garlic Bread 200g',
  ],
  'Personal Care': [
    'Colgate Strong Teeth 200g', 'Pepsodent Germicheck 200g', 'Sensodyne Repair 70g',
    'Head & Shoulders Shampoo 180ml', 'Sunsilk Black Shine 180ml', 'Dove Intense Repair 180ml',
    'Lifebuoy Total Soap 125g', 'Dettol Original Soap 125g', 'Lux Soft Touch 100g',
    'Nivea Soft Cream 200ml', 'Vaseline Petroleum Jelly 100g', 'Gillette Guard 3pc',
    'Whisper Ultra XL 7pc', 'Stayfree Secure XL 8pc', 'Pampers Baby Pants M 24pc',
  ],
  Cleaning: [
    'Surf Excel Matic Top Load 1kg', 'Ariel Matic Liquid 1L', 'Tide Plus 1kg',
    'Vim Dishwash Gel 500ml', 'Pril Dishwash 750ml', 'Harpic Power Plus 500ml',
    'Lizol Citrus 975ml', 'Colin Glass Cleaner 500ml', 'Dettol Antiseptic 500ml',
    'Domex Toilet Expert 500ml', 'Exo Dishwash Bar 700g', 'Rin Bar 250g',
  ],
  Frozen: [
    'McCain French Fries 400g', 'McCain Smiles 415g', 'ITC Master Chef Frozen Paratha 6pc',
    'Safal Frozen Green Peas 500g', 'Fresho Frozen Mixed Veg 500g', 'Yummiez Chicken Nuggets 250g',
    'Amul Ice Cream Vanilla 1L', 'Kwality Walls Magnum Classic 80ml', 'Mother Dairy Kulfi 6pc',
  ],
  Produce: [
    'Fresh Onions 1kg Net', 'Fresh Potatoes 1kg', 'Tomatoes Hybrid 500g',
    'Bananas Robusta 1 dozen', 'Shimla Apples 500g', 'Green Grapes 500g',
    'Carrots Orange 500g', 'Cauliflower 1pc', 'Broccoli 250g',
    'Spinach Bunch 250g', 'Coriander Bunch 100g', 'Mint Bunch 100g',
    'Lemon 250g', 'Ginger 100g', 'Garlic Peeled 100g',
  ],
  Spices: [
    'MDH Garam Masala 100g', 'Everest Shahi Biryani Masala 50g', 'Everest Kitchen King 100g',
    'MDH Kashmiri Mirch 100g', 'Catch Turmeric Powder 200g', 'Catch Red Chilli Powder 200g',
    'Everest Meat Masala 100g', 'MDH Chana Masala 100g', 'Everest Pav Bhaji Masala 100g',
    'Catch Coriander Powder 200g', 'Catch Cumin Whole 100g', 'Catch Black Pepper 100g',
    'Tata Sampann Hing 50g', 'MDH Kasuri Methi 25g', 'Everest Chaat Masala 100g',
  ],
};

const CATEGORIES = Object.keys(NAME_POOL);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build 500 unique names by cycling categories and shuffled pools */
function buildUniqueNames(count) {
  const names = [];
  const seen = new Set();
  const pools = {};
  for (const c of CATEGORIES) {
    pools[c] = shuffle(NAME_POOL[c]);
  }
  let catIdx = 0;
  let safety = 0;
  while (names.length < count && safety < count * 20) {
    safety++;
    const cat = CATEGORIES[catIdx % CATEGORIES.length];
    catIdx++;
    const pool = pools[cat];
    const base = pool[names.length % pool.length];
    let name = base;
    let n = 1;
    while (seen.has(name)) {
      name = `${base} (${n})`;
      n++;
    }
    seen.add(name);
    names.push({ name, category: cat });
  }
  if (names.length < count) {
    for (let k = names.length; k < count; k++) {
      names.push({
        name: `Store SKU ${k + 1} Mixed Grocery`,
        category: CATEGORIES[k % CATEGORIES.length],
      });
    }
  }
  return names.slice(0, count);
}

const products = [];
const usedBarcodes = new Set();
const nameEntries = buildUniqueNames(500);

for (let i = 1; i <= 500; i++) {
  const barcode = `890${String(1000000000 + i).slice(0, 10)}`;
  if (usedBarcodes.has(barcode)) throw new Error('dup barcode');
  usedBarcodes.add(barcode);

  const { name, category } = nameEntries[i - 1];
  const price = randInt(9, 899);
  const stock = randInt(0, 100);

  products.push({
    id: i,
    name,
    barcode,
    price,
    category,
    stock,
  });
}

fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), 'utf8');

const lines = [
  'VeloCart — first 20 products for barcode testing (EAN-13, India prefix 890)',
  'Format: BARCODE<TAB>NAME',
  '',
];
for (let j = 0; j < 20; j++) {
  const p = products[j];
  lines.push(`${p.barcode}\t${p.name}`);
}
fs.writeFileSync(OUT_TXT, lines.join('\n'), 'utf8');

console.log('Wrote', OUT_JSON);
console.log('Wrote', OUT_TXT);

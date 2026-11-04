/**
 * Catalog for Halden Goods, the fictional store Statlume reports on.
 * Every name here is made up for this practice project.
 */
export interface CatalogProduct {
  title: string;
  category: string;
  /** Relative popularity. Higher sells more. */
  weight: number;
  variants: { title: string; price: number }[];
}

const sizes = (base: number) => [
  { title: 'Small', price: base },
  { title: 'Large', price: Math.round(base * 1.35 * 100) / 100 },
];

const colours = (price: number, names: string[]) => names.map((title) => ({ title, price }));

export const CATALOG: CatalogProduct[] = [
  // Kitchen
  { title: 'Ash Wood Cutting Board', category: 'Kitchen', weight: 9, variants: sizes(34) },
  { title: 'Stoneware Mixing Bowl', category: 'Kitchen', weight: 6, variants: sizes(28) },
  {
    title: 'Linen Apron',
    category: 'Kitchen',
    weight: 5,
    variants: colours(32, ['Oat', 'Charcoal', 'Rust']),
  },
  {
    title: 'Cast Iron Skillet 10 in',
    category: 'Kitchen',
    weight: 7,
    variants: [{ title: 'Default', price: 58 }],
  },
  {
    title: 'Pour Over Coffee Set',
    category: 'Kitchen',
    weight: 8,
    variants: [{ title: 'Default', price: 46 }],
  },
  {
    title: 'Beechwood Spoon Trio',
    category: 'Kitchen',
    weight: 10,
    variants: [{ title: 'Default', price: 18 }],
  },
  {
    title: 'Glass Storage Jar',
    category: 'Kitchen',
    weight: 7,
    variants: colours(14, ['500 ml', '1 litre']),
  },
  {
    title: 'Enamel Tea Kettle',
    category: 'Kitchen',
    weight: 4,
    variants: colours(64, ['Cream', 'Sage']),
  },
  // Tableware
  {
    title: 'Everyday Dinner Plate',
    category: 'Tableware',
    weight: 9,
    variants: colours(16, ['Chalk', 'Slate']),
  },
  {
    title: 'Ribbed Tumbler Set of 4',
    category: 'Tableware',
    weight: 8,
    variants: [{ title: 'Default', price: 30 }],
  },
  {
    title: 'Stoneware Mug',
    category: 'Tableware',
    weight: 12,
    variants: colours(15, ['Chalk', 'Moss', 'Clay']),
  },
  {
    title: 'Walnut Serving Tray',
    category: 'Tableware',
    weight: 4,
    variants: [{ title: 'Default', price: 72 }],
  },
  {
    title: 'Linen Napkin Set',
    category: 'Tableware',
    weight: 6,
    variants: colours(26, ['Oat', 'Indigo']),
  },
  { title: 'Hand Thrown Bowl', category: 'Tableware', weight: 7, variants: sizes(19) },
  {
    title: 'Brass Cutlery Set',
    category: 'Tableware',
    weight: 3,
    variants: [{ title: 'Default', price: 88 }],
  },
  {
    title: 'Carafe and Cup',
    category: 'Tableware',
    weight: 4,
    variants: [{ title: 'Default', price: 38 }],
  },
  // Bath
  {
    title: 'Waffle Bath Towel',
    category: 'Bath',
    weight: 10,
    variants: colours(36, ['White', 'Stone', 'Fern']),
  },
  {
    title: 'Cedar Soap Bar',
    category: 'Bath',
    weight: 11,
    variants: [{ title: 'Default', price: 9 }],
  },
  {
    title: 'Bath Mat in Cotton',
    category: 'Bath',
    weight: 5,
    variants: colours(42, ['White', 'Stone']),
  },
  {
    title: 'Ceramic Soap Dish',
    category: 'Bath',
    weight: 6,
    variants: [{ title: 'Default', price: 14 }],
  },
  {
    title: 'Linen Shower Curtain',
    category: 'Bath',
    weight: 3,
    variants: [{ title: 'Default', price: 79 }],
  },
  {
    title: 'Hand Towel Pair',
    category: 'Bath',
    weight: 8,
    variants: colours(24, ['White', 'Stone', 'Fern']),
  },
  {
    title: 'Bamboo Bath Caddy',
    category: 'Bath',
    weight: 4,
    variants: [{ title: 'Default', price: 48 }],
  },
  { title: 'Body Brush', category: 'Bath', weight: 5, variants: [{ title: 'Default', price: 16 }] },
  // Bedding
  {
    title: 'Washed Linen Duvet Cover',
    category: 'Bedding',
    weight: 6,
    variants: [
      { title: 'Queen', price: 189 },
      { title: 'King', price: 219 },
    ],
  },
  {
    title: 'Percale Sheet Set',
    category: 'Bedding',
    weight: 7,
    variants: [
      { title: 'Queen', price: 129 },
      { title: 'King', price: 149 },
    ],
  },
  {
    title: 'Wool Throw Blanket',
    category: 'Bedding',
    weight: 5,
    variants: colours(98, ['Oat', 'Charcoal']),
  },
  {
    title: 'Linen Pillowcase Pair',
    category: 'Bedding',
    weight: 8,
    variants: colours(44, ['White', 'Oat', 'Clay']),
  },
  {
    title: 'Down Alternative Pillow',
    category: 'Bedding',
    weight: 6,
    variants: [
      { title: 'Standard', price: 59 },
      { title: 'King', price: 69 },
    ],
  },
  {
    title: 'Quilted Bedspread',
    category: 'Bedding',
    weight: 3,
    variants: [{ title: 'Queen', price: 168 }],
  },
  {
    title: 'Cotton Waffle Blanket',
    category: 'Bedding',
    weight: 4,
    variants: colours(84, ['White', 'Sage']),
  },
  {
    title: 'Silk Eye Mask',
    category: 'Bedding',
    weight: 6,
    variants: [{ title: 'Default', price: 22 }],
  },
  // Decor
  {
    title: 'Beeswax Taper Candles',
    category: 'Decor',
    weight: 9,
    variants: [
      { title: 'Pair', price: 12 },
      { title: 'Six pack', price: 30 },
    ],
  },
  {
    title: 'Stoneware Bud Vase',
    category: 'Decor',
    weight: 7,
    variants: colours(24, ['Chalk', 'Clay']),
  },
  {
    title: 'Jute Area Rug',
    category: 'Decor',
    weight: 2,
    variants: [{ title: '5 x 8 ft', price: 249 }],
  },
  { title: 'Oak Picture Frame', category: 'Decor', weight: 6, variants: sizes(26) },
  {
    title: 'Brass Candle Holder',
    category: 'Decor',
    weight: 5,
    variants: [{ title: 'Default', price: 34 }],
  },
  { title: 'Woven Storage Basket', category: 'Decor', weight: 7, variants: sizes(39) },
  {
    title: 'Linen Cushion Cover',
    category: 'Decor',
    weight: 8,
    variants: colours(29, ['Oat', 'Rust', 'Indigo']),
  },
  {
    title: 'Wall Clock in Ash',
    category: 'Decor',
    weight: 3,
    variants: [{ title: 'Default', price: 68 }],
  },
];

export const FIRST_NAMES = [
  'Ava',
  'Ben',
  'Cora',
  'Dev',
  'Eli',
  'Faye',
  'Gus',
  'Hana',
  'Ivo',
  'Jude',
  'Kira',
  'Leo',
  'Mina',
  'Noor',
  'Omar',
  'Pia',
  'Quin',
  'Rae',
  'Sami',
  'Tess',
  'Uma',
  'Vik',
  'Wren',
  'Yara',
  'Zane',
  'Aris',
  'Bea',
  'Cal',
  'Dara',
  'Esme',
  'Finn',
  'Gia',
  'Hugo',
  'Isla',
  'Jonah',
  'Lena',
  'Milo',
  'Nell',
  'Otto',
  'Remy',
  'Sana',
  'Theo',
  'Vera',
  'Wade',
  'Zoe',
];

export const LAST_NAMES = [
  'Abbot',
  'Brook',
  'Carver',
  'Dale',
  'Ellery',
  'Frost',
  'Glenn',
  'Hollis',
  'Iver',
  'Jensen',
  'Keller',
  'Lowe',
  'Marsh',
  'Nolan',
  'Oakes',
  'Pryor',
  'Quill',
  'Rowe',
  'Shaw',
  'Thorne',
  'Upton',
  'Vance',
  'Wilder',
  'Yates',
  'Ziegler',
  'Ashby',
  'Burke',
  'Crane',
  'Dunn',
  'Ferris',
  'Grant',
  'Hale',
  'Kemp',
  'Lyle',
  'Moss',
  'Pike',
  'Reed',
  'Stone',
  'Tate',
  'Webb',
];

export const CITIES = [
  'Albany',
  'Boston',
  'Chicago',
  'Denver',
  'Portland',
  'Austin',
  'Seattle',
  'Atlanta',
  'Phoenix',
  'Minneapolis',
  'Raleigh',
  'Pittsburgh',
  'Baltimore',
  'Nashville',
  'Richmond',
  'Madison',
];

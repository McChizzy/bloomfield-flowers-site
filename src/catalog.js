export const products = [
  {
    id: 'barbie-deluxe-m',
    name: 'The Seraphina',
    category: 'Flowers',
    price: '₦55,000 - ₦80,000',
    image: '/images/optimized/barbie-deluxe.jpg',
    short: 'A lush mixed bouquet made with roses, spray roses, lilies, and gypsos fillers.',
    description: 'Mixed bouquet (M) made with different types of flowers, including 20 roses, 3 spray roses, 6 lilies, and 2 gypsos fillers.',
    instagramPost: 'https://www.instagram.com/p/DWuVT6lDu8v/?img_index=1',
  },
  {
    id: 'pastel-cloud-s',
    name: 'Barbie Deluxe',
    category: 'Flowers',
    price: '₦250,000',
    image: '/images/optimized/pastel-cloud.jpg',
    short: 'A soft pastel mixed bouquet with lilac, white, and pink blooms.',
    description: 'Mixed bouquet (S) made with different colors of chrysanthemums, lilac, white, pink roses, and gypsos.',
    instagramPost: 'https://www.instagram.com/p/DV-wqrvDVVs/?img_index=1',
  },
  {
    id: 'century-of-roses',
    name: 'Century of Roses',
    category: 'Flowers',
    price: '₦700,000 - ₦800,000',
    image: '/images/optimized/century-of-roses.jpg',
    short: 'A dramatic 100-rose arrangement for grand romantic and luxury gifting moments.',
    description: 'A premium rose statement piece featuring 100 roses in red, pink, white, yellow, or purple.',
    instagramPost: 'https://www.instagram.com/p/DV36cdujSiI/',
  },
  {
    id: 'bff-collection',
    name: 'BFF Collection',
    category: 'Flowers',
    price: '₦390,000 - ₦840,000',
    image: '/images/optimized/bff-collection.jpg',
    short: 'A signature rose collection styled with gypsos lettering for standout gifting.',
    description: 'A premium collection of 50, 75, or 100 roses styled with custom gypsos letters.',
    instagramPost: 'https://www.instagram.com/p/DVi5Wt0l8my/?img_index=1',
  },
  {
    id: 'the-radiant-garden',
    name: 'The Radiant Garden',
    category: 'Flowers',
    price: '₦150,000 - ₦400,000',
    image: '/images/optimized/radiant-garden.jpg',
    short: 'A full mixed bouquet with layered floral textures and a rich premium feel.',
    description: 'Mixed bouquet (L) made with chrysanthemums, lilies, roses, spray roses, and gypsos.',
    instagramPost: 'https://www.instagram.com/p/DW61kFWDT10/?img_index=1',
  },
]

export function parsePriceValue(price, city = '') {
  if (typeof price === 'number') return price
  const cleaned = String(price).replace(/[^\d]/g, ' ').trim()
  const parts = cleaned.split(/\s+/).map(Number).filter((n) => Number.isFinite(n) && n > 0)
  if (parts.length === 0) return 0
  if (parts.length === 1) return parts[0]
  // Lagos = lower price, Abuja = higher price
  return city === 'Abuja' ? Math.max(...parts) : Math.min(...parts)
}

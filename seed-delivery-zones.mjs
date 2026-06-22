// One-time seed script — creates the two delivery zone documents.
// Usage:
//   1. Get a Sanity write token: sanity.io/manage → your project → API → Tokens → Add API Token (Editor role)
//   2. Run: SANITY_TOKEN=your_token node seed-delivery-zones.mjs
import { createClient } from '@sanity/client'

const token = process.env.SANITY_TOKEN
if (!token) {
  console.error('Error: SANITY_TOKEN env var is required.')
  console.error('Get one at sanity.io/manage → your project → API → Tokens')
  process.exit(1)
}

const client = createClient({
  projectId: 'zvn4k75r',
  dataset:   'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const zones = [
  {
    _type: 'deliveryZone',
    _id:   'delivery-zone-uae',
    zoneName:        { en: 'UAE', ar: 'الإمارات العربية المتحدة' },
    rate:            50,   // placeholder — edit in Sanity Studio
    currency:        'AED',
    installationFee: 200,  // placeholder — edit in Sanity Studio
  },
  {
    _type: 'deliveryZone',
    _id:   'delivery-zone-gcc',
    zoneName: { en: 'Rest of GCC', ar: 'دول الخليج الأخرى' },
    rate:     150,  // placeholder — edit in Sanity Studio
    currency: 'AED',
    // installationFee intentionally omitted — not offered outside UAE
  },
]

for (const zone of zones) {
  await client.createOrReplace(zone)
  console.log(`✓ Created: ${zone.zoneName.en} (${zone._id})`)
}
console.log('Done. Edit rates at sanity.io/manage or in the Studio.')

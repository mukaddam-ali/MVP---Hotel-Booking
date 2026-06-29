import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const units = [
  { name: 'Unit One',        slug: 'unit-one',        type: 'Two Bedroom',           pricePerNight: 250, cleaningFee: 100, maxGuests: 4, bedrooms: '2', bathrooms: '2', sqft: '900'  },
  { name: 'Unit Two',        slug: 'unit-two',        type: 'Two Bedroom',           pricePerNight: 250, cleaningFee: 100, maxGuests: 4, bedrooms: '2', bathrooms: '2', sqft: '900'  },
  { name: 'Unit Three',      slug: 'unit-three',      type: 'Two Bedroom',           pricePerNight: 250, cleaningFee: 100, maxGuests: 4, bedrooms: '2', bathrooms: '2', sqft: '900'  },
  { name: 'Unit South',      slug: 'unit-south',      type: 'Two Bedroom',           pricePerNight: 250, cleaningFee: 100, maxGuests: 4, bedrooms: '2', bathrooms: '2', sqft: '900'  },
  { name: 'Unit Five',       slug: 'unit-five',       type: 'Studio',                pricePerNight: 120, cleaningFee: 65,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '450' },
  { name: 'Unit Six',        slug: 'unit-six',        type: 'Studio',                pricePerNight: 120, cleaningFee: 65,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '450' },
  { name: 'Unit 23-1',       slug: 'unit-23-1',       type: 'One Bedroom',           pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '650'  },
  { name: 'Unit 23-2',       slug: 'unit-23-2',       type: 'Studio Loft',           pricePerNight: 130, cleaningFee: 65,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '500' },
  { name: 'Unit SW',         slug: 'unit-sw',         type: 'One Bedroom',           pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '650'  },
  { name: 'Unit NW',         slug: 'unit-nw',         type: 'One Bedroom',           pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '650'  },
  { name: 'Unit 1A',         slug: 'unit-1a',         type: 'One Bedroom',           pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '650'  },
  { name: 'Unit 2A',         slug: 'unit-2a',         type: 'One Bedroom',           pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '650'  },
  { name: 'Unit SE',         slug: 'unit-se',         type: 'Efficiency',            pricePerNight: 100, cleaningFee: 50,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '400' },
  { name: 'Unit NE',         slug: 'unit-ne',         type: 'Efficiency',            pricePerNight: 100, cleaningFee: 50,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '400' },
  { name: 'Unit B1',         slug: 'unit-b1',         type: 'Efficiency',            pricePerNight: 100, cleaningFee: 50,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '400' },
  { name: 'Unit B2',         slug: 'unit-b2',         type: 'Efficiency',            pricePerNight: 100, cleaningFee: 50,  maxGuests: 2, bedrooms: 'Studio', bathrooms: '1', sqft: '400' },
  { name: 'Unit 25 Cottage', slug: 'unit-25-cottage', type: 'Cottage / One Bedroom', pricePerNight: 180, cleaningFee: 80,  maxGuests: 2, bedrooms: '1', bathrooms: '1', sqft: '700'  },
];

async function main() {
  console.log('Seeding 17 units...');
  for (const unit of units) {
    await prisma.unit.upsert({
      where: { slug: unit.slug },
      update: {},
      create: {
        ...unit,
        description: [],
        images: [],
        amenities: [],
        icalUrl: null,
      },
    });
  }
  console.log('Done — 17 units seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

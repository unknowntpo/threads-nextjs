import { prisma } from '@/lib/prisma';

const posts3DPrinter = [
  "Just finished my first 3D print! A small benchmarking cube came out perfect. Can't wait to try more complex models! 🖨️",
  'Pro tip: Always level your 3D printer bed before starting a print. I learned this the hard way after several failed prints 😅',
  'My Ender 3 has been running non-stop for weeks now. Best investment for a maker! The print quality is amazing for the price.',
  'Finally upgraded to direct drive extruder on my printer. The difference in print quality with flexible filaments is incredible! 🎯',
  'Anyone else obsessed with watching their 3D prints? I could sit here for hours watching the layers build up. So satisfying!',
  'Printed a custom phone stand today. Total cost: $0.50 in filament. Retail price would be $15. 3D printing pays for itself! 💰',
  'PSA: Store your filament properly! Moisture is the enemy. Just started using a dry box and my prints are so much better now.',
  'Working on a multi-color print with my dual extruder setup. The rainbow dragon is coming along nicely! 🐉🌈',
  '3D printing community is the best! Someone shared their bed leveling trick and it completely solved my adhesion issues. Thank you! 🙏',
  'Designing custom parts in Fusion 360, then seeing them come to life on the printer. This is what the future feels like! 🚀',
];

async function main() {
  console.log('🌱 Seeding 3D printer posts...');

  // Find or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'testuser@example.com' },
  });

  if (!user) {
    console.log('Creating test user...');
    user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        username: 'maker3d',
        displayName: '3D Print Enthusiast',
        name: '3D Print Enthusiast',
        emailVerified: new Date(),
      },
    });

    // Create credentials account
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      },
    });
    console.log('✅ Test user created:', user.username);
  } else {
    console.log('✅ Using existing user:', user.username);
  }

  // Create posts with varying timestamps to make them more realistic
  let createdCount = 0;
  const now = new Date();

  for (let i = 0; i < posts3DPrinter.length; i++) {
    const content = posts3DPrinter[i];
    // Create posts with timestamps spread over the last 7 days
    const daysAgo = Math.floor(i / 2); // 2 posts per day
    const hoursAgo = (i % 2) * 12; // Morning and evening posts
    const createdAt = new Date(
      now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000
    );

    await prisma.post.create({
      data: {
        userId: user.id,
        content,
        mediaUrls: [], // Empty array for media
        createdAt,
      },
    });
    createdCount++;
    console.log(`✅ Created post ${createdCount}/10`);
  }

  console.log(`\n🎉 Successfully created ${createdCount} posts about 3D printers!`);
  console.log(`📝 User: ${user.username} (${user.email})`);
  console.log('\nYou can now test the search functionality with queries like:');
  console.log('  - "3D printer"');
  console.log('  - "print"');
  console.log('  - "filament"');
  console.log('  - "Ender" (should find Ender 3)');
  console.log('  - "prnt" (typo test - should still find "print")');
}

main()
  .catch(e => {
    console.error('❌ Error seeding posts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

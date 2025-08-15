import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Users
  const users = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: faker.internet.password(),
          country: faker.location.country(),
          county: faker.location.county(),
          city: faker.location.city(),
          eloRating: faker.number.int({ min: 800, max: 2000 }),
        },
      })
    )
  )

  // Seed Documents
  const documents = await Promise.all(
    users.map(user =>
      prisma.document.create({
        data: {
          userId: user.id,
          title: faker.lorem.sentence(),
          category: faker.lorem.word(),
          content: faker.lorem.paragraphs(),
        },
      })
    )
  )

  // Seed Quiz Attempts
  await Promise.all(
    documents.flatMap(doc =>
      Array.from({ length: 5 }).map(() =>
        prisma.quizAttempt.create({
          data: {
            userId: doc.userId,
            documentId: doc.id,
            score: faker.number.int({ min: 0, max: 100 }),
            completedAt: faker.date.past(),
          },
        })
      )
    )
  )

  console.log('Database seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

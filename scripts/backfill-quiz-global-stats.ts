import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfill() {
  console.log('Backfilling Quiz.attempts and Quiz.accuracy (v1.9)...')
  const batchSize = 200
  let offset = 0
  let processed = 0

  while (true) {
    const quizzes = await prisma.quiz.findMany({
      select: { id: true, derivedFromDocumentId: true },
      orderBy: { id: 'asc' },
      skip: offset,
      take: batchSize,
    })
    if (quizzes.length === 0) break

    for (const q of quizzes) {
      // Prefer attempts linked by quizId
      const statsByQuiz = await prisma.quizAttempt.aggregate({
        _count: { _all: true },
        _avg: { score: true },
        where: { quizId: q.id, completedAt: { not: null } },
      })

      let attempts = statsByQuiz._count?._all ?? 0
      let avgScore = statsByQuiz._avg?.score ?? null

      if (attempts === 0 && q.derivedFromDocumentId) {
        const statsByDoc = await prisma.quizAttempt.aggregate({
          _count: { _all: true },
          _avg: { score: true },
          where: { documentId: q.derivedFromDocumentId, completedAt: { not: null } },
        })
        attempts = statsByDoc._count?._all ?? 0
        avgScore = statsByDoc._avg?.score ?? null
      }

      const accuracy = avgScore ? Math.round(((avgScore / 100) * 10000)) / 10000 : 0
      await prisma.quiz.update({ where: { id: q.id }, data: { attempts, accuracy } })
      processed++
    }

    offset += quizzes.length
    console.log(`Processed ${processed} quizzes...`)
  }

  console.log(`Backfill complete. Updated ${processed} quizzes.`)
}

backfill()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



import { PrismaClient, QuizMode, Difficulty, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.BACKFILL_EMAIL || 'exam@example.com'
  const city = process.env.BACKFILL_CITY || 'San Francisco'
  const country = process.env.BACKFILL_COUNTRY || 'United States'

  const user = await prisma.user.findFirst({ where: { email } })
  if (!user) {
    console.error(`User with email ${email} not found.`)
    process.exit(1)
  }

  // Lightweight categories
  const categories = ['Mathematics', 'History', 'Science', 'Literature', 'Geography']

  // Ensure profile fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      city,
      country,
      county: 'San Francisco County',
      qlo: user.qlo ?? 100,
      isPublicProfile: true
    }
  })

  // Create a few documents with categories if none exist for this user
  const existingDocs = await prisma.document.count({ where: { userId: user.id } })
  const docs: any[] = []
  if (existingDocs < 3) {
    for (let i = 0; i < 5; i++) {
      const category = categories[i % categories.length]
      const doc = await prisma.document.create({
        data: {
          userId: user.id,
          title: `${category} Basics ${i + 1}`,
          category,
          sourceType: 'TEXT_INPUT',
          contentJson: { content: `Generated content for ${category}` },
          tags: [category]
        }
      })
      docs.push(doc)
      // Create 10 questions with 4 answers
      for (let q = 0; q < 10; q++) {
        const question = await prisma.question.create({
          data: {
            documentId: doc.id,
            questionText: `Q${q + 1}: ${category} concept check?`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: (['EASY','MEDIUM','HARD'] as Difficulty[])[q % 3],
            explanation: 'Because it is so.'
          }
        })
        for (let a = 0; a < 4; a++) {
          await prisma.answer.create({
            data: {
              questionId: question.id,
              answerText: a === 0 ? 'Correct' : `Option ${a+1}`,
              isCorrect: a === 0,
              explanation: a === 0 ? 'This is correct' : 'Not correct',
              orderIndex: a
            }
          })
        }
      }
    }
  } else {
    const list = await prisma.document.findMany({ where: { userId: user.id } })
    docs.push(...list)
  }

  // Generate 10 quiz attempts over last 30 days
  const now = new Date()
  for (let i = 0; i < 10; i++) {
    const daysAgo = 1 + Math.floor((30 / 10) * i)
    const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const doc = docs[i % docs.length]

    const questions = await prisma.question.findMany({ where: { documentId: doc.id }, include: { answers: true } })
    if (questions.length === 0) continue
    const selected = questions.slice(0, Math.min(10, questions.length))

    const qa = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        documentId: doc.id,
        startTime: start,
        quizMode: 'PRACTICE',
        totalQuestions: selected.length,
        correctAnswers: 0,
        score: 0,
        timeSpent: 0,
        createdAt: start
      }
    })

    let correct = 0
    let totalMs = 0
    for (const q of selected) {
      const isCorrect = Math.random() < 0.7
      if (isCorrect) correct++
      const t = 5000 + Math.floor(Math.random() * 20000)
      totalMs += t
      const sel = isCorrect ? q.answers.find(a => a.isCorrect)! : q.answers[1]
      await prisma.userQuestionHistory.create({
        data: {
          userId: user.id,
          questionId: q.id,
          quizAttemptId: qa.id,
          wasCorrect: isCorrect,
          timeSpent: Math.ceil(t/1000),
          timeToAnswer: t,
          selectedAnswerId: sel?.id || null,
          confidenceLevel: 3,
          createdAt: new Date(start.getTime() + totalMs)
        }
      })
    }

    const end = new Date(start.getTime() + totalMs)
    const score = (correct / selected.length) * 100
    await prisma.quizAttempt.update({
      where: { id: qa.id },
      data: {
        endTime: end,
        completedAt: end,
        timeSpent: Math.ceil(totalMs/1000),
        score,
        correctAnswers: correct
      }
    })
  }

  // Seed QloHistory for this user
  const existingQlo = await (prisma as any).qloHistory.count({ where: { userId: user.id } })
  if (existingQlo === 0) {
    let qlo = (await prisma.user.findUnique({ where: { id: user.id } }))?.qlo ?? 100
    for (let i = 15; i >= 1; i--) {
      const changedAt = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000)
      qlo = Math.max(0, qlo + Math.floor((Math.random()-0.5)*40))
      await (prisma as any).qloHistory.create({ data: { userId: user.id, qlo, changedAt, source: 'backfill' } })
    }
    await (prisma as any).qloHistory.create({ data: { userId: user.id, qlo, changedAt: now, source: 'backfill' } })
  }

  console.log(`✅ Backfilled user ${email}. Visit /analytics and /analytics?tab=leaderboards`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })



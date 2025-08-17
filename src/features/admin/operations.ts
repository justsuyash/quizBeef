import { HttpError } from 'wasp/server'
import { faker } from '@faker-js/faker'
import type { SeedDatabase, BackfillMyAccount, GrantDemoAchievementsAll, SeedEloHistoryAll, RebuildLeaderboardStatsAll } from 'wasp/server/operations'
import type { ResetMySeededData, AddRandomNinjas } from 'wasp/server/operations'
import type { AchievementCategory, AchievementRarity, ProfileType, AccountType, QuizMode, Difficulty, SourceType } from '@prisma/client'

export const seedDatabase: SeedDatabase<{ recentBoost?: boolean }, { success: boolean; message: string; stats?: any }> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'You must be logged in to seed the database')
  const nodeEnv = process.env.NODE_ENV || 'development'
  if (nodeEnv === 'production') throw new HttpError(403, 'Database seeding is not allowed in production environment')

  const prisma = context.entities
  const recentBoost = args?.recentBoost ?? true

  const TOTAL_USERS = 500
  const DAYS_OF_HISTORY = 365
  const CATEGORIES = ['Mathematics','Science','History','Literature','Geography','Physics','Chemistry','Biology','Computer Science','Philosophy','Economics','Psychology','Art','Music','Sports','Politics']
  const POPULAR_COUNTRIES = [
    { country: 'United States', cities: ['New York','Los Angeles','Chicago','Houston','Phoenix'] },
    { country: 'India', cities: ['Mumbai','Delhi','Bangalore','Chennai','Kolkata'] },
    { country: 'United Kingdom', cities: ['London','Manchester','Birmingham','Liverpool','Leeds'] },
    { country: 'Canada', cities: ['Toronto','Vancouver','Montreal','Calgary','Ottawa'] },
    { country: 'Australia', cities: ['Sydney','Melbourne','Brisbane','Perth','Adelaide'] },
    { country: 'Germany', cities: ['Berlin','Munich','Hamburg','Cologne','Frankfurt'] },
    { country: 'France', cities: ['Paris','Lyon','Marseille','Toulouse','Nice'] },
    { country: 'Brazil', cities: ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza'] },
    { country: 'Japan', cities: ['Tokyo','Osaka','Kyoto','Yokohama','Nagoya'] },
    { country: 'South Korea', cities: ['Seoul','Busan','Incheon','Daegu','Daejeon'] }
  ]

  const before = {
    userCount: await prisma.User.count(),
    documentCount: await prisma.Document.count(),
    quizAttemptCount: await prisma.QuizAttempt.count()
  }

  // Delta seeding: always add a fresh batch of users/documents on each run
  const BATCH_USERS = 100

  // 1) Achievements
  const achievementsExisting = await prisma.Achievement.count()
  if (achievementsExisting === 0) {
    const achievements = [
      { key: 'FIRST_QUIZ_COMPLETED', name: 'Quiz Rookie', description: 'Complete your first quiz', category: 'QUIZ' as AchievementCategory, iconName: 'graduation-cap', iconColor: '#10B981', rarity: 'COMMON' as AchievementRarity, criteria: { type: 'QUIZ_COUNT', target: 1 }, pointsReward: 10 },
      { key: 'QUIZ_PERFECTIONIST', name: 'Perfectionist', description: 'Score 100% on a quiz', category: 'QUIZ' as AchievementCategory, iconName: 'star', iconColor: '#F59E0B', rarity: 'UNCOMMON' as AchievementRarity, criteria: { type: 'PERFECT_SCORE', target: 1 }, pointsReward: 25 },
      { key: 'QUIZ_MASTER_100', name: 'Quiz Master', description: 'Complete 100 quizzes', category: 'QUIZ' as AchievementCategory, iconName: 'trophy', iconColor: '#8B5CF6', rarity: 'RARE' as AchievementRarity, criteria: { type: 'QUIZ_COUNT', target: 100 }, pointsReward: 100 }
    ]
    for (const a of achievements) await prisma.Achievement.create({ data: a })
  }

  // 2) Users
  const users: any[] = []
  for (let i = 0; i < BATCH_USERS; i++) {
    const loc = faker.helpers.arrayElement(POPULAR_COUNTRIES)
    const city = faker.helpers.arrayElement(loc.cities)
    // Seed QLO roughly around 5000 with moderate variance
    const qlo = Math.round(5000 + faker.number.int({ min: -1200, max: 1200 }))
    const usernameForAvatar = faker.internet.userName().toLowerCase()
    const diceBear = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(usernameForAvatar)}&backgroundType=gradientLinear,solid&radius=50`
    const pravatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(usernameForAvatar)}@quizbeef`
    const avatarUrl = Math.random() < 0.5 ? pravatar : diceBear
    const user = await prisma.User.create({ data: { email: faker.internet.email(), name: faker.person.fullName(), handle: usernameForAvatar, avatarUrl, profileType: 'ADULT' as ProfileType, accountType: faker.helpers.weightedArrayElement([{ weight: 70, value: 'FREE' as AccountType },{ weight: 20, value: 'PREMIUM' as AccountType },{ weight: 10, value: 'FAMILY' as AccountType }]), city, county: faker.location.county(), country: loc.country, qlo, favoriteSubject: faker.helpers.arrayElement(CATEGORIES), language: 'en', createdAt: faker.date.between({ from: new Date(Date.now() - DAYS_OF_HISTORY * 24 * 60 * 60 * 1000), to: new Date() }) } })
    users.push(user)
    if ((i + 1) % 50 === 0) console.log(`   Created ${i + 1}/${TOTAL_USERS} users...`)
  }

  // 3) Documents & Folders
  const documents: any[] = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const folderCount = faker.number.int({ min: 1, max: 3 })
    const folders: any[] = []
    const shuffled = faker.helpers.shuffle([...CATEGORIES])
    for (let f = 0; f < folderCount; f++) {
      const name = shuffled[f % shuffled.length]
      const folder = await prisma.Folder.create({ data: { userId: user.id, name, description: faker.lorem.sentence(), color: faker.color.rgb() } })
      folders.push(folder)
    }
    const docCount = faker.number.int({ min: 2, max: 8 })
    for (let d = 0; d < docCount; d++) {
      const category = faker.helpers.arrayElement(CATEGORIES)
      const document = await prisma.Document.create({ data: { userId: user.id, folderId: faker.helpers.maybe(() => faker.helpers.arrayElement(folders).id, { probability: 0.7 }), title: `${category}: ${faker.lorem.words(3)}`, category, sourceType: faker.helpers.arrayElement(['PDF','TEXT_INPUT','WEB_ARTICLE'] as SourceType[]), contentJson: { content: faker.lorem.paragraphs(5), summary: faker.lorem.paragraph() }, tags: [category, ...faker.lorem.words(2).split(' ')], wordCount: faker.number.int({ min: 500, max: 5000 }), estimatedReadTime: faker.number.int({ min: 2, max: 20 }) } })
      documents.push(document)
    }
    if ((i + 1) % 50 === 0) console.log(`   Created documents for ${i + 1}/${users.length} users...`)
  }

  // 4) Questions & Answers
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]
    const qCount = faker.number.int({ min: 5, max: 15 })
    for (let q = 0; q < qCount; q++) {
      const question = await prisma.Question.create({ data: { documentId: doc.id, questionText: `${faker.lorem.sentence()}?`, questionType: 'MULTIPLE_CHOICE', difficulty: (faker.helpers.weightedArrayElement(['EASY','MEDIUM','HARD','EXPERT'] as any) ?? 'MEDIUM') as Difficulty, explanation: faker.lorem.sentence(), timesAsked: faker.number.int({ min: 0, max: 50 }), correctRate: faker.number.float({ min: 0.3, max: 0.95 }) } })
      for (let a = 0; a < 4; a++) {
        await prisma.Answer.create({ data: { questionId: question.id, answerText: a === 0 ? 'Correct answer' : `Incorrect option ${a}`, isCorrect: a === 0, explanation: a === 0 ? 'This is the correct answer' : 'This is incorrect because...', orderIndex: a } })
      }
    }
    if ((i + 1) % 100 === 0) console.log(`   Created questions for ${i + 1}/${documents.length} documents...`)
  }

  // 5) Quiz Histories
  const now = new Date()
  for (let ui = 0; ui < users.length; ui++) {
    const user = users[ui]
    const userDocs = documents.filter(d => d.userId === user.id)
    const perWeek = 3
    const total = Math.floor(perWeek * (DAYS_OF_HISTORY / 7))
    for (let k = 0; k < total; k++) {
      // Optional recency bias for more lively deltas
      let dayOffset: number
      if (recentBoost) {
        const roll = Math.random()
        if (roll < 0.55) {
          dayOffset = faker.number.int({ min: 0, max: Math.min(30, DAYS_OF_HISTORY) })
        } else if (roll < 0.85) {
          dayOffset = faker.number.int({ min: 31, max: Math.min(90, DAYS_OF_HISTORY) })
        } else {
          dayOffset = faker.number.int({ min: 91, max: DAYS_OF_HISTORY })
        }
      } else {
        dayOffset = faker.number.int({ min: 0, max: DAYS_OF_HISTORY })
      }
      const quizDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000)
      const document = faker.helpers.arrayElement(userDocs)
      const questions = await prisma.Question.findMany({ where: { documentId: document.id }, include: { answers: true } })
      if (questions.length === 0) continue
      const selected = questions.slice(0, Math.min(10, questions.length))
      let correct = 0
      let totalMs = 0
      const qa = await prisma.QuizAttempt.create({ data: { userId: user.id, documentId: document.id, startTime: quizDate, quizMode: 'PRACTICE' as QuizMode, totalQuestions: selected.length, correctAnswers: 0, score: 0, timeSpent: 0, createdAt: quizDate } })
      for (const q of selected) {
        const isCorrect = Math.random() < 0.7
        if (isCorrect) correct++
        const t = 5000 + Math.floor(Math.random() * 20000)
        totalMs += t
        const sel = isCorrect ? q.answers.find(a => a.isCorrect)! : q.answers[1]
        await prisma.UserQuestionHistory.create({ data: { userId: user.id, questionId: q.id, quizAttemptId: qa.id, wasCorrect: isCorrect, timeSpent: Math.ceil(t/1000), timeToAnswer: t, selectedAnswerId: sel?.id || null, confidenceLevel: 3, createdAt: new Date(quizDate.getTime() + totalMs) } })
      }
      const end = new Date(quizDate.getTime() + totalMs)
      const score = (correct / selected.length) * 100
      await prisma.QuizAttempt.update({ where: { id: qa.id }, data: { endTime: end, completedAt: end, timeSpent: Math.ceil(totalMs/1000), score, correctAnswers: correct } })
    }
    if ((ui + 1) % 25 === 0) console.log(`   Created quiz histories for ${ui + 1}/${users.length} users...`)
  }

  // 6) Groups & Memberships for leaderboard bars
  try {
    const groupCount = 5
    const memberPerGroup = 20
    const groups: any[] = []
    for (let i = 0; i < groupCount; i++) {
      const g = await prisma.Group.upsert({
        where: { name: `Group ${i + 1}` },
        update: {},
        create: { name: `Group ${i + 1}`, description: 'Auto-seeded group' }
      })
      groups.push(g)
    }
    const allUsers = await prisma.User.findMany({ select: { id: true } })
    for (const g of groups) {
      const shuffled = faker.helpers.shuffle([...allUsers]).slice(0, Math.min(memberPerGroup, allUsers.length))
      for (const u of shuffled) {
        await prisma.GroupMembership.upsert({
          where: { userId_groupId: { userId: u.id, groupId: g.id } },
          update: {},
          create: { userId: u.id, groupId: g.id }
        })
      }
      if (context.user) {
        await prisma.GroupMembership.upsert({
          where: { userId_groupId: { userId: context.user.id, groupId: g.id } },
          update: {},
          create: { userId: context.user.id, groupId: g.id }
        })
      }
    }
  } catch(e) {
    console.warn('Group seeding skipped/failed:', e)
  }

  // 6) QLO History (light)
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    const existing = await prisma.QloHistory.count({ where: { userId: u.id } })
    if (existing > 0) continue
    let qlo = u.qlo ?? 5000
    for (let j = 15; j >= 1; j--) {
      const changedAt = new Date(now.getTime() - j * 2 * 24 * 60 * 60 * 1000)
      qlo = Math.max(0, qlo + Math.floor((Math.random()-0.5)*80))
      await prisma.QloHistory.create({ data: { userId: u.id, qlo, changedAt, source: 'seed' } })
    }
    await prisma.QloHistory.create({ data: { userId: u.id, qlo, changedAt: now, source: 'seed', note: 'Current' } })
  }

  const after = {
    userCount: await prisma.User.count(),
    documentCount: await prisma.Document.count(),
    quizAttemptCount: await prisma.QuizAttempt.count(),
    achievementCount: await prisma.Achievement.count(),
    userAchievementCount: await prisma.UserAchievement.count()
  }

  const stats = { before, after, added: { users: after.userCount - before.userCount, documents: after.documentCount - before.documentCount, quizAttempts: after.quizAttemptCount - before.quizAttemptCount } }
  // Notify current user to refresh stats via SSE
  try {
    const { emitStatsUpdate } = await import('../../server/events/stats')
    if (context.user?.id) emitStatsUpdate(context.user.id, { type: 'refresh' })
  } catch {}
  return { success: true, message: 'Database seeded with advanced demo data.', stats }
}

export const backfillMyAccount: BackfillMyAccount<{}, { success: boolean }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')

  try {
    const prisma = context.entities
    const user = await prisma.User.findUnique({ where: { id: context.user.id } })
    if (!user) throw new HttpError(404, 'User not found')

    // Ensure location
    await prisma.User.update({ where: { id: user.id }, data: { city: user.city ?? 'San Francisco', country: user.country ?? 'United States', county: user.county ?? 'San Francisco County' } })

    // Ensure avatarUrl seeded for current user
    if (!user.avatarUrl) {
      const seedBase = (user.handle || user.name || `user-${user.id}`).toString().toLowerCase().replace(/\s+/g, '')
      const diceBear = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seedBase)}&backgroundType=gradientLinear,solid&radius=50`
      const pravatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(seedBase)}@quizbeef`
      const avatarUrl = Math.random() < 0.5 ? pravatar : diceBear
      await prisma.User.update({ where: { id: user.id }, data: { avatarUrl } })
    }

    // Create a small categorized document if none
    const docCount = await prisma.Document.count({ where: { userId: user.id } })
    if (docCount === 0) {
      const doc = await prisma.Document.create({ data: { userId: user.id, title: 'Math Basics', category: 'Mathematics', sourceType: 'TEXT_INPUT', contentJson: { content: 'Seeded content' }, tags: ['Mathematics'] } })
      for (let q = 0; q < 10; q++) {
        const question = await prisma.Question.create({ data: { documentId: doc.id, questionText: `What is ${q}+${q}?`, questionType: 'MULTIPLE_CHOICE', difficulty: 'EASY' } })
        for (let a = 0; a < 4; a++) {
          await prisma.Answer.create({ data: { questionId: question.id, answerText: a === 0 ? 'Correct' : `Option ${a+1}`, isCorrect: a === 0, orderIndex: a } })
        }
      }
    }

    const docs = await prisma.Document.findMany({ where: { userId: user.id } })
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const start = new Date(now.getTime() - (i+1) * 3 * 24 * 60 * 60 * 1000)
      const doc = docs[i % docs.length]
      const questions = await prisma.Question.findMany({ where: { documentId: doc.id }, include: { answers: true } })
      if (questions.length === 0) continue
      const selected = questions.slice(0, Math.min(10, questions.length))
      const qa = await prisma.QuizAttempt.create({ data: { userId: user.id, documentId: doc.id, startTime: start, quizMode: 'PRACTICE', totalQuestions: selected.length, correctAnswers: 0, score: 0, timeSpent: 0, createdAt: start } })
      let correct = 0
      let totalMs = 0
      for (const q of selected) {
        const isCorrect = Math.random() < 0.7
        if (isCorrect) correct++
        const t = 5000 + Math.floor(Math.random() * 20000)
        totalMs += t
        const sel = isCorrect ? q.answers.find(a => a.isCorrect)! : q.answers[1]
        await prisma.UserQuestionHistory.create({ data: { userId: user.id, questionId: q.id, quizAttemptId: qa.id, wasCorrect: isCorrect, timeSpent: Math.ceil(t/1000), timeToAnswer: t, selectedAnswerId: sel?.id || null, confidenceLevel: 3, createdAt: new Date(start.getTime() + totalMs) } })
      }
      const end = new Date(start.getTime() + totalMs)
      const score = (correct / selected.length) * 100
      await prisma.QuizAttempt.update({ where: { id: qa.id }, data: { endTime: end, completedAt: end, timeSpent: Math.ceil(totalMs/1000), score, correctAnswers: correct } })
    }

    // QLO history for user
    const existing = await prisma.QloHistory.count({ where: { userId: user.id } })
    if (existing === 0) {
      let qlo = user.qlo ?? 100
      for (let i = 10; i >= 1; i--) {
        const t = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000)
        qlo = Math.max(0, qlo + Math.floor((Math.random()-0.5)*80))
        await prisma.QloHistory.create({ data: { userId: user.id, qlo, changedAt: t, source: 'backfill' } })
      }
      await prisma.QloHistory.create({ data: { userId: user.id, qlo, changedAt: new Date(), source: 'backfill' } })
    }

    // Emit refresh for current user
    try {
      const { emitStatsUpdate } = await import('../../server/events/stats')
      emitStatsUpdate(context.user.id, { type: 'refresh' })
    } catch {}
    return { success: true }
  } catch (e) {
    console.error(e)
    throw new HttpError(500, 'Failed to backfill account')
  }
}

export const grantDemoAchievementsAll: GrantDemoAchievementsAll<{}, { success: boolean; count: number }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')
  const prisma = context.entities
  const achievements = await prisma.Achievement.findMany({ where: { key: { in: ['FIRST_QUIZ_COMPLETED','QUIZ_PERFECTIONIST','QUIZ_MASTER_100'] } } })
  let granted = 0
  const users = await prisma.User.findMany({ select: { id: true } })
  for (const u of users) {
    for (const a of achievements) {
      const existing = await prisma.UserAchievement.findFirst({ where: { userId: u.id, achievementId: a.id } })
      if (!existing) {
        await prisma.UserAchievement.create({ data: { userId: u.id, achievementId: a.id } })
        granted++
      }
    }
  }
  return { success: true, count: granted }
}

export const seedEloHistoryAll: SeedEloHistoryAll<{}, { success: boolean }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')
  const prisma = context.entities
  const users = await prisma.User.findMany({ select: { id: true, qlo: true } })
  for (const u of users) {
    const existing = await prisma.QloHistory.count({ where: { userId: u.id } })
    if (existing > 0) continue
    let qlo = u.qlo ?? 5000
    const now = new Date()
    for (let i = 20; i >= 1; i--) {
      const t = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000)
      qlo = Math.max(0, qlo + Math.floor((Math.random()-0.5)*80))
      await prisma.QloHistory.create({ data: { userId: u.id, qlo, changedAt: t, source: 'backfill-all' } })
    }
    await prisma.QloHistory.create({ data: { userId: u.id, qlo, changedAt: now, source: 'backfill-all', note: 'Current' } })
  }
  return { success: true }
}

export const rebuildLeaderboardStatsAll: RebuildLeaderboardStatsAll<{}, { success: boolean }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')
  const prisma = context.entities
  const users = await prisma.User.findMany({ select: { id: true } })
  for (const u of users) {
    const attempts = await prisma.QuizAttempt.findMany({ where: { userId: u.id } })
    if (attempts.length === 0) continue
    const totalQuizzes = attempts.length
    const totalScore = attempts.reduce((s, a) => s + a.score, 0)
    const averageAccuracy = totalScore / totalQuizzes / 100
    await prisma.User.update({ where: { id: u.id }, data: { totalQuizzes, totalScore: Math.round(totalScore), averageAccuracy } })
  }
  return { success: true }
}

// Danger: remove seeded personal data for current user to allow clean reseeding
export const resetMySeededData: ResetMySeededData<{}, { success: boolean }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')
  const prisma = context.entities
  const userId = context.user.id
  await prisma.UserAchievement.deleteMany({ where: { userId } })
  await prisma.UserQuestionHistory.deleteMany({ where: { userId } })
  await prisma.QuizAttempt.deleteMany({ where: { userId } })
  await prisma.QloHistory.deleteMany({ where: { userId } })
  await prisma.Document.deleteMany({ where: { userId } })
  await prisma.Folder.deleteMany({ where: { userId } })
  // Optionally reset rolls
  await prisma.User.update({ where: { id: userId }, data: { totalScore: 0, totalQuizzes: 0, averageAccuracy: null, totalBeefWins: 0 } })
  try { const { emitStatsUpdate } = await import('../../server/events/stats'); emitStatsUpdate(userId, { type: 'refresh' }) } catch {}
  return { success: true }
}

// Fun: add random number of ninjas to current user (assassins count stand-in)
export const addRandomNinjas: AddRandomNinjas<{}, { success: boolean; count: number }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Must be logged in')
  const count = Math.floor(Math.random() * 20) + 1
  // We don't have a ninjas table; simulate by bumping totalBeefWins as a playful stat
  await context.entities.User.update({ where: { id: context.user.id }, data: { totalBeefWins: { increment: count } } })
  try { const { emitStatsUpdate } = await import('../../server/events/stats'); emitStatsUpdate(context.user.id, { type: 'refresh' }) } catch {}
  return { success: true, count }
}

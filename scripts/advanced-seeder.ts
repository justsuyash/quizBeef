import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import type { QuizMode, Difficulty, QuestionType, SourceType, ProfileType, AccountType, AchievementCategory, AchievementRarity } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const TOTAL_USERS = 2000 // Create many users for realistic leaderboards
const DAYS_OF_HISTORY = 90 // 3 months of realistic activity (general activity)
// Streak seeding configuration (kept efficient by applying to a subset of users)
const MAX_STREAK_YEARS = 5
const MAX_STREAK_DAYS = MAX_STREAK_YEARS * 365
const STREAK_USERS_PERCENT = 0.05 // 5% of users get a long random streak
const MIN_STREAK_DAYS = 7
const CATEGORIES = [
  'Mathematics', 'Science', 'History', 'Literature', 'Geography', 
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Philosophy',
  'Economics', 'Psychology', 'Art', 'Music', 'Sports', 'Politics'
]

// Realistic location data for distribution
const POPULAR_COUNTRIES = [
  { country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { country: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'] },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'] },
  { country: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'] },
  { country: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
  { country: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'] },
  { country: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] }
]

async function main() {
  console.log('🚀 Starting comprehensive database seeding...')
  
  // Check if already seeded - allow continuous seeding up to TOTAL_USERS
  const existingUserCount = await prisma.user.count()
  if (existingUserCount >= TOTAL_USERS) {
    console.log(`⚠️  Database already has ${existingUserCount} users (target: ${TOTAL_USERS}). Skipping user creation.`)
    console.log('   Proceeding with group seeding and other enhancements...')
    
    // Still run streak/group seeding and other functions for existing users
    const allUsers = await prisma.user.findMany()
    await seedRandomStreaks(allUsers)
    await seedLeaderboardGroups(allUsers)
    return
  }

  // Seed achievements first
  await seedAchievements()
  
  // Create realistic user distribution
  console.log(`👥 Creating ${TOTAL_USERS} users with realistic data...`)
  const users = await createUsers()
  
  console.log(`📚 Creating documents and folders...`)
  const documents = await createDocumentsAndFolders(users)
  
  console.log(`🧠 Generating questions for documents...`)
  await createQuestions(documents)
  
  console.log(`📊 Creating 90-day quiz histories...`)
  await createQuizHistories(users, documents)
  
  console.log(`🏆 Awarding achievements based on performance...`)
  await awardAchievements(users)
  
  console.log(`🥇 Updating QLO and user stats...`)
  await updateUserStats(users)

  console.log(`🏅 Designating top performers with high QLO & rare achievements...`)
  await designateTopPerformers(users)

  console.log(`📈 Seeding QLO rating history time-series for charts...`)
  await seedQloHistory(users)

  console.log(`🔥 Seeding random long-day streaks for a subset of users...`)
  await seedRandomStreaks(users)

  console.log(`👥 Creating leaderboard groups with proper distribution...`)
  await seedLeaderboardGroups(users)

  console.log('✅ Database seeded successfully with realistic data!')
  console.log(`   - ${users.length} users across ${POPULAR_COUNTRIES.length} countries`)
  console.log(`   - ${documents.length} documents with questions`)
  console.log(`   - 90 days of quiz history per user`)
  console.log(`   - Achievements awarded based on performance`)
  console.log(`   - Realistic QLO distribution`)
  console.log(`   - Leaderboard groups with 10-50 members each`)
}

async function seedAchievements() {
  const existingCount = await prisma.achievement.count()
  if (existingCount > 0) {
    console.log('   Achievements already exist, skipping...')
    return
  }

  const achievements = [
    // Quiz Category
    {
      key: 'FIRST_QUIZ_COMPLETED',
      name: 'Quiz Rookie',
      description: 'Complete your first quiz',
      category: 'QUIZ' as AchievementCategory,
      iconName: 'graduation-cap',
      iconColor: '#10B981',
      rarity: 'COMMON' as AchievementRarity,
      criteria: { type: 'QUIZ_COUNT', target: 1 },
      pointsReward: 10
    },
    {
      key: 'QUIZ_PERFECTIONIST',
      name: 'Perfectionist',
      description: 'Score 100% on a quiz',
      category: 'QUIZ' as AchievementCategory,
      iconName: 'star',
      iconColor: '#F59E0B',
      rarity: 'UNCOMMON' as AchievementRarity,
      criteria: { type: 'PERFECT_SCORE', target: 1 },
      pointsReward: 25
    },
    {
      key: 'QUIZ_MASTER_100',
      name: 'Quiz Master',
      description: 'Complete 100 quizzes',
      category: 'QUIZ' as AchievementCategory,
      iconName: 'trophy',
      iconColor: '#8B5CF6',
      rarity: 'RARE' as AchievementRarity,
      criteria: { type: 'QUIZ_COUNT', target: 100 },
      pointsReward: 100
    },
    {
      key: 'SPEED_DEMON',
      name: 'Speed Demon',
      description: 'Complete a quiz in under 30 seconds',
      category: 'LEARNING' as AchievementCategory,
      iconName: 'zap',
      iconColor: '#06B6D4',
      rarity: 'UNCOMMON' as AchievementRarity,
      criteria: { type: 'QUIZ_TIME', target: 30, operator: 'less_than' },
      pointsReward: 30
    },
    {
      key: 'DAILY_STREAK_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day activity streak',
      category: 'STREAK' as AchievementCategory,
      iconName: 'calendar',
      iconColor: '#84CC16',
      rarity: 'UNCOMMON' as AchievementRarity,
      criteria: { type: 'DAILY_STREAK', target: 7 },
      pointsReward: 75
    },
    {
      key: 'EARLY_ADOPTER',
      name: 'Early Adopter',
      description: 'One of the first 100 users',
      category: 'SPECIAL' as AchievementCategory,
      iconName: 'sparkles',
      iconColor: '#EC4899',
      rarity: 'LEGENDARY' as AchievementRarity,
      criteria: { type: 'USER_ID', target: 100, operator: 'less_than_or_equal' },
      pointsReward: 500,
      isHidden: true
    }
  ]

  for (const achievementData of achievements) {
    await prisma.achievement.create({ data: achievementData })
  }
  console.log(`   ✅ Created ${achievements.length} achievements`)
}

async function createUsers(): Promise<any[]> {
  const users = []
  
  for (let i = 0; i < TOTAL_USERS; i++) {
    const locationData = faker.helpers.arrayElement(POPULAR_COUNTRIES)
    const city = faker.helpers.arrayElement(locationData.cities)
    
    // Create realistic Elo distribution (bell curve around 1200)
    // Start most users near the global default (100), with small spread
    const qlo = Math.max(100, Math.round(100 + faker.number.int({ min: 0, max: 300 })))
    
    // Choose avatar provider (DiceBear or Pravatar) for variety
    const usernameForAvatar = faker.internet.userName().toLowerCase()
    const diceBear = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(usernameForAvatar)}&backgroundType=gradientLinear,solid&radius=50`
    const pravatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(usernameForAvatar)}@quizbeef`
    const avatarUrl = Math.random() < 0.5 ? pravatar : diceBear

    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        handle: usernameForAvatar,
        avatarUrl,
        profileType: faker.helpers.weightedArrayElement([
          { weight: 85, value: 'ADULT' as ProfileType },
          { weight: 15, value: 'KID' as ProfileType }
        ]),
        accountType: faker.helpers.weightedArrayElement([
          { weight: 70, value: 'FREE' as AccountType },
          { weight: 20, value: 'PREMIUM' as AccountType },
          { weight: 10, value: 'FAMILY' as AccountType }
        ]),
        city,
        county: faker.location.county(),
        country: locationData.country,
        qlo,
        bio: faker.helpers.maybe(() => faker.lorem.sentence(), 0.4),
        favoriteSubject: faker.helpers.arrayElement(CATEGORIES),
        language: faker.helpers.weightedArrayElement([
          { weight: 60, value: 'en' },
          { weight: 15, value: 'es' },
          { weight: 10, value: 'fr' },
          { weight: 8, value: 'de' },
          { weight: 7, value: 'zh' }
        ]),
        createdAt: faker.date.between({ 
          from: new Date(Date.now() - DAYS_OF_HISTORY * 24 * 60 * 60 * 1000),
          to: new Date()
        })
      }
    })
    users.push(user)
    
    if (i % 50 === 0) {
      console.log(`   Created ${i + 1}/${TOTAL_USERS} users...`)
    }
  }
  
  return users
}

async function createDocumentsAndFolders(users: any[]): Promise<any[]> {
  const documents = []
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    
    // Create 1-3 folders per user with unique names per user
    const folderCount = faker.number.int({ min: 1, max: 3 })
    const folders = []
    const shuffledCategories = faker.helpers.shuffle([...CATEGORIES])
    const usedNames = new Set<string>()

    for (let f = 0; f < folderCount; f++) {
      let name = shuffledCategories[f % shuffledCategories.length]
      // Ensure uniqueness per user
      let attempt = 0
      while (usedNames.has(name) && attempt < 5) {
        name = shuffledCategories[(f + attempt) % shuffledCategories.length]
        attempt++
      }
      if (usedNames.has(name)) {
        name = `${name}-${f}`
      }
      usedNames.add(name)

      const folder = await prisma.folder.create({
        data: {
          userId: user.id,
          name,
          description: faker.lorem.sentence(),
          color: faker.color.rgb()
        }
      })
      folders.push(folder)
    }
    
    // Create 2-8 documents per user
    const docCount = faker.number.int({ min: 2, max: 8 })
    
    for (let d = 0; d < docCount; d++) {
      const category = faker.helpers.arrayElement(CATEGORIES)
      const document = await prisma.document.create({
        data: {
          userId: user.id,
          folderId: faker.helpers.maybe(() => faker.helpers.arrayElement(folders).id, 0.7),
          title: `${category}: ${faker.lorem.words(3)}`,
          category,
          sourceType: faker.helpers.arrayElement(['PDF', 'TEXT_INPUT', 'WEB_ARTICLE'] as SourceType[]),
          contentJson: {
            content: faker.lorem.paragraphs(5),
            summary: faker.lorem.paragraph()
          },
          tags: [category, ...faker.lorem.words(2).split(' ')],
          wordCount: faker.number.int({ min: 500, max: 5000 }),
          estimatedReadTime: faker.number.int({ min: 2, max: 20 }),
          sourceUrl: faker.helpers.maybe(() => faker.internet.url(), 0.3)
        }
      })
      documents.push(document)
    }
    
    if (i % 50 === 0) {
      console.log(`   Created documents for ${i + 1}/${users.length} users...`)
    }
  }
  
  return documents
}

async function createQuestions(documents: any[]) {
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]
    
    // Create 5-15 questions per document
    const questionCount = faker.number.int({ min: 5, max: 15 })
    
    for (let q = 0; q < questionCount; q++) {
      const question = await prisma.question.create({
        data: {
          documentId: document.id,
          questionText: `${faker.lorem.sentence()}?`,
          questionType: faker.helpers.weightedArrayElement([
            { weight: 70, value: 'MULTIPLE_CHOICE' as QuestionType },
            { weight: 20, value: 'TRUE_FALSE' as QuestionType },
            { weight: 10, value: 'SHORT_ANSWER' as QuestionType }
          ]),
          difficulty: faker.helpers.weightedArrayElement([
            { weight: 40, value: 'EASY' as Difficulty },
            { weight: 35, value: 'MEDIUM' as Difficulty },
            { weight: 20, value: 'HARD' as Difficulty },
            { weight: 5, value: 'EXPERT' as Difficulty }
          ]),
          explanation: faker.lorem.sentence(),
          timesAsked: faker.number.int({ min: 0, max: 50 }),
          correctRate: faker.number.float({ min: 0.3, max: 0.95 })
        }
      })
      
      // Create answers for each question
      const answerCount = question.questionType === 'TRUE_FALSE' ? 2 : 
                         question.questionType === 'MULTIPLE_CHOICE' ? 4 : 1
      
      for (let a = 0; a < answerCount; a++) {
        await prisma.answer.create({
          data: {
            questionId: question.id,
            answerText: a === 0 ? 'Correct answer' : `Incorrect option ${a}`,
            isCorrect: a === 0,
            explanation: a === 0 ? 'This is the correct answer' : 'This is incorrect because...',
            orderIndex: a
          }
        })
      }
    }
    
    if (i % 100 === 0) {
      console.log(`   Created questions for ${i + 1}/${documents.length} documents...`)
    }
  }
}

async function createQuizHistories(users: any[], documents: any[]) {
  const now = new Date()
  
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex]
    const userDocuments = documents.filter(d => d.userId === user.id)
    
    if (userDocuments.length === 0) continue
    
    // Create activity pattern - some users are more active than others
    const activityLevel = faker.helpers.weightedArrayElement([
      { weight: 40, value: 'low' },    // 1-2 quizzes per week
      { weight: 40, value: 'medium' }, // 3-5 quizzes per week  
      { weight: 15, value: 'high' },   // 6-10 quizzes per week
      { weight: 5, value: 'extreme' }  // 10+ quizzes per week
    ])
    
    const quizzesPerWeek = {
      low: faker.number.int({ min: 1, max: 2 }),
      medium: faker.number.int({ min: 3, max: 5 }),
      high: faker.number.int({ min: 6, max: 10 }),
      extreme: faker.number.int({ min: 10, max: 20 })
    }[activityLevel]
    
    const totalQuizzes = Math.floor(quizzesPerWeek * (DAYS_OF_HISTORY / 7))
    
    for (let q = 0; q < totalQuizzes; q++) {
      // Create realistic quiz timing (weekdays vs weekends, peak hours)
      const quizDate = new Date(now.getTime() - faker.number.int({ min: 0, max: DAYS_OF_HISTORY }) * 24 * 60 * 60 * 1000)
      
      // Realistic peak hours (7-9 AM, 12-2 PM, 6-10 PM)
      const peakHours = [7, 8, 12, 13, 18, 19, 20, 21]
      const hour = faker.helpers.weightedArrayElement([
        ...peakHours.map(h => ({ weight: 3, value: h })),
        ...Array.from({length: 24}, (_, i) => ({ weight: 1, value: i }))
      ])
      
      quizDate.setHours(hour, faker.number.int({ min: 0, max: 59 }))
      
      const document = faker.helpers.arrayElement(userDocuments)
      
      // Get questions for this document
      const questions = await prisma.question.findMany({
        where: { documentId: document.id },
        include: { answers: true }
      })
      
      if (questions.length === 0) continue
      
      const selectedQuestions = faker.helpers.arrayElements(questions, 
        faker.number.int({ min: Math.min(5, questions.length), max: Math.min(15, questions.length) })
      )
      
      // User skill affects performance (based on Elo rating)
      const skillLevel = Math.max(0, Math.min(1, (user.qlo - 100) / 1000)) // 0-1 scale
      const baseAccuracy = Math.max(0.3, Math.min(0.95, 0.5 + skillLevel * 0.4))
      
      let correctAnswers = 0
      const startTime = new Date(quizDate)
      let totalTimeSpent = 0
      
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          documentId: document.id,
          startTime,
          quizMode: faker.helpers.weightedArrayElement([
            { weight: 60, value: 'PRACTICE' as QuizMode },
            { weight: 15, value: 'TEST_MODE' as QuizMode },
            { weight: 10, value: 'SPEED_ROUND' as QuizMode },
            { weight: 10, value: 'RAPID_FIRE' as QuizMode },
            { weight: 5, value: 'TIME_ATTACK' as QuizMode }
          ]),
          totalQuestions: selectedQuestions.length,
          correctAnswers: 0, // Will update later
          score: 0, // Will update later
          timeSpent: 0, // Will update later
          createdAt: quizDate,
          completedAt: quizDate
        }
      })
      
      // Create question history for each question
      for (const question of selectedQuestions) {
        const isCorrect = faker.datatype.boolean({ probability: baseAccuracy })
        const timeToAnswer = faker.number.int({ 
          min: 2000, // 2 seconds minimum
          max: question.difficulty === 'EASY' ? 15000 : 
               question.difficulty === 'MEDIUM' ? 30000 :
               question.difficulty === 'HARD' ? 45000 : 60000
        })
        
        totalTimeSpent += timeToAnswer
        if (isCorrect) correctAnswers++
        
        const correctAnswer = question.answers.find(a => a.isCorrect)
        const selectedAnswer = isCorrect ? correctAnswer : faker.helpers.arrayElement(question.answers)
        
        await prisma.userQuestionHistory.create({
          data: {
            userId: user.id,
            questionId: question.id,
            quizAttemptId: quizAttempt.id,
            wasCorrect: isCorrect,
            timeSpent: Math.ceil(timeToAnswer / 1000), // Convert to seconds
            timeToAnswer,
            selectedAnswerId: selectedAnswer?.id,
            confidenceLevel: faker.number.int({ min: 1, max: 5 }),
            createdAt: new Date(quizDate.getTime() + totalTimeSpent)
          }
        })
      }
      
      // Update quiz attempt with final stats
      const endTime = new Date(startTime.getTime() + totalTimeSpent)
      const score = (correctAnswers / selectedQuestions.length) * 100
      
      await prisma.quizAttempt.update({
        where: { id: quizAttempt.id },
        data: {
          endTime,
          correctAnswers,
          score,
          timeSpent: Math.ceil(totalTimeSpent / 1000),
          completedAt: endTime
        }
      })
    }
    
    if (userIndex % 25 === 0) {
      console.log(`   Created quiz histories for ${userIndex + 1}/${users.length} users...`)
    }
  }
}

// Seed random long streaks (up to MAX_STREAK_DAYS) by ensuring daily quiz activity
// for a small subset of users. This augments existing histories by filling in
// daily activity back in time so that the streak calculation will see
// consecutive days.
async function seedRandomStreaks(users: any[]) {
  const prismaAny: any = prisma
  const chosenUsers = [...users]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(1, Math.floor(users.length * STREAK_USERS_PERCENT)))

  for (const user of chosenUsers) {
    // Pick a random streak length between MIN_STREAK_DAYS and MAX_STREAK_DAYS
    const streakLength = Math.floor(
      Math.random() * (MAX_STREAK_DAYS - MIN_STREAK_DAYS + 1)
    ) + MIN_STREAK_DAYS

    // Fetch any document for this user; if none exists, create one
    let doc = await prisma.document.findFirst({ where: { userId: user.id } })
    if (!doc) {
      doc = await prisma.document.create({
        data: {
          userId: user.id,
          title: 'Streak Seeding Doc',
          category: 'General',
          sourceType: 'TEXT_INPUT' as SourceType,
          contentJson: { content: 'Auto generated content for streak seeding' },
          tags: ['streak', 'auto']
        }
      })
      // Ensure a few questions exist
      const q = await prisma.question.create({
        data: {
          documentId: doc.id,
          questionText: 'Auto question?',
          questionType: 'MULTIPLE_CHOICE' as QuestionType,
          difficulty: 'EASY' as Difficulty,
          explanation: 'Auto generated'
        }
      })
      for (let a = 0; a < 4; a++) {
        await prisma.answer.create({
          data: {
            questionId: q.id,
            answerText: a === 0 ? 'Correct' : `Option ${a + 1}`,
            isCorrect: a === 0,
            orderIndex: a
          }
        })
      }
    }

    // We'll create a lightweight quizAttempt per day going back streakLength days
    // to guarantee a streak. To keep performance reasonable, we only generate
    // one short quiz per day (5 questions, ~random score/time).
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    for (let d = 0; d < streakLength; d++) {
      const day = new Date(today)
      day.setDate(today.getDate() - d)

      // Skip if there is already an attempt on this day to avoid duplicates
      const existing = await prisma.quizAttempt.findFirst({
        where: {
          userId: user.id,
          completedAt: {
            gte: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0),
            lt: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0)
          }
        },
        select: { id: true }
      })
      if (existing) continue

      // Prepare questions (fallback to creating a few if missing)
      let questions = await prisma.question.findMany({
        where: { documentId: doc.id },
        include: { answers: true },
        take: 5
      })
      if (questions.length < 1) {
        const q = await prisma.question.create({
          data: {
            documentId: doc.id,
            questionText: 'Auto seeded question?',
            questionType: 'MULTIPLE_CHOICE' as QuestionType,
            difficulty: 'EASY' as Difficulty,
            explanation: 'Auto'
          }
        })
        for (let a = 0; a < 4; a++) {
          await prisma.answer.create({
            data: {
              questionId: q.id,
              answerText: a === 0 ? 'Correct' : `Option ${a + 1}`,
              isCorrect: a === 0,
              orderIndex: a
            }
          })
        }
        questions = await prisma.question.findMany({
          where: { documentId: doc.id },
          include: { answers: true },
          take: 5
        })
      }

      const startTime = new Date(day)
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          documentId: doc.id,
          startTime,
          quizMode: 'PRACTICE' as QuizMode,
          totalQuestions: questions.length,
          correctAnswers: 0,
          score: 0,
          timeSpent: 0,
          createdAt: startTime,
          completedAt: startTime
        }
      })

      // Simulate answers quickly
      let correct = 0
      let totalMs = 0
      for (const q of questions) {
        const isCorrect = Math.random() < 0.7
        if (isCorrect) correct++
        const t = 4000 + Math.floor(Math.random() * 12000)
        totalMs += t
        const sel = isCorrect ? q.answers.find(a => a.isCorrect)! : q.answers[1]
        await prisma.userQuestionHistory.create({
          data: {
            userId: user.id,
            questionId: q.id,
            quizAttemptId: quizAttempt.id,
            wasCorrect: isCorrect,
            timeSpent: Math.ceil(t / 1000),
            timeToAnswer: t,
            selectedAnswerId: sel?.id || null,
            confidenceLevel: 3,
            createdAt: new Date(startTime.getTime() + totalMs)
          }
        })
      }

      const end = new Date(startTime.getTime() + totalMs)
      const score = (correct / questions.length) * 100
      await prisma.quizAttempt.update({
        where: { id: quizAttempt.id },
        data: {
          endTime: end,
          completedAt: end,
          timeSpent: Math.ceil(totalMs / 1000),
          score,
          correctAnswers: correct
        }
      })
    }
  }

  console.log(`   ✅ Seeded long-day streaks for ${chosenUsers.length} users (up to ${MAX_STREAK_DAYS} days)`)
}

async function awardAchievements(users: any[]) {
  const achievements = await prisma.achievement.findMany()
  
  for (const user of users) {
    // Award early adopter to first 100 users
    if (user.id <= 100) {
      const earlyAdopter = achievements.find(a => a.key === 'EARLY_ADOPTER')
      if (earlyAdopter) {
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: earlyAdopter.id,
            unlockedAt: user.createdAt
          }
        })
      }
    }
    
    // Award based on quiz completion count
    const quizCount = await prisma.quizAttempt.count({ where: { userId: user.id } })
    
    if (quizCount >= 1) {
      const firstQuiz = achievements.find(a => a.key === 'FIRST_QUIZ_COMPLETED')
      if (firstQuiz) {
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: firstQuiz.id,
            unlockedAt: faker.date.between({ 
              from: user.createdAt,
              to: new Date()
            })
          }
        })
      }
    }
    
    if (quizCount >= 100) {
      const quizMaster = achievements.find(a => a.key === 'QUIZ_MASTER_100')
      if (quizMaster) {
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: quizMaster.id,
            unlockedAt: faker.date.recent({ days: 30 })
          }
        })
      }
    }
    
    // Award perfectionist for high scorers
    const perfectScores = await prisma.quizAttempt.count({
      where: { userId: user.id, score: 100 }
    })
    
    if (perfectScores >= 1) {
      const perfectionist = achievements.find(a => a.key === 'QUIZ_PERFECTIONIST')
      if (perfectionist) {
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: perfectionist.id,
            unlockedAt: faker.date.recent({ days: 60 })
          }
        })
      }
    }
  }
  
  console.log('   ✅ Awarded achievements based on performance')
}

async function updateUserStats(users: any[]) {
  for (const user of users) {
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id }
    })
    
    if (quizAttempts.length === 0) continue
    
    const totalScore = quizAttempts.reduce((sum, qa) => sum + qa.score, 0)
    const averageAccuracy = totalScore / quizAttempts.length
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalQuizzes: quizAttempts.length,
        totalScore: Math.round(totalScore),
        averageAccuracy: averageAccuracy / 100 // Convert to decimal
      }
    })
  }
  
  console.log('   ✅ Updated user statistics')
}

// Promote a subset of users to "top performers" with high Elo and rare achievements
async function designateTopPerformers(users: any[]) {
  // Pick top 15 by current Elo, or random if Elo ties
  const sorted = [...users].sort((a, b) => (b.qlo ?? 0) - (a.qlo ?? 0))
  const topCount = Math.min(15, sorted.length)
  const topUsers = sorted.slice(0, topCount)

  // Fetch rare/legendary achievements we want to grant
  const achievements = await prisma.achievement.findMany({
    where: { key: { in: ['QUIZ_MASTER_100', 'QUIZ_PERFECTIONIST', 'EARLY_ADOPTER'] } }
  })
  const byKey: Record<string, any> = {}
  for (const a of achievements) byKey[a.key] = a

  for (let i = 0; i < topUsers.length; i++) {
    const u = topUsers[i]

    // Assign a strong Elo distribution 1800-2200 with slight variance
    const boostedElo = 1500 + Math.floor((topCount - i) * 10) + Math.floor(Math.random() * 500)

    await prisma.user.update({
      where: { id: u.id },
      data: {
        qlo: boostedElo,
        totalBeefWins: { increment: Math.floor(10 + Math.random() * 40) },
        longestWinStreak: { increment: Math.floor(3 + Math.random() * 10) }
      }
    })

    // Grant rare achievements where available
    const grantIfExists = async (key: string) => {
      const ach = byKey[key]
      if (!ach) return
      const already = await prisma.userAchievement.findFirst({ where: { userId: u.id, achievementId: ach.id } })
      if (!already) {
        await prisma.userAchievement.create({
          data: {
            userId: u.id,
            achievementId: ach.id,
            unlockedAt: new Date()
          }
        })
      }
    }

    await grantIfExists('QUIZ_MASTER_100')
    await grantIfExists('QUIZ_PERFECTIONIST')
    // Early adopter stays limited to first 100; only grant if applicable by ID
    if (u.id <= 100) {
      await grantIfExists('EARLY_ADOPTER')
    }
  }

  console.log(`   ✅ Marked ${topUsers.length} users as top performers`)
}

// Generate synthetic QloHistory for users to populate comparative charts
async function seedQloHistory(users: any[]) {
  const now = new Date()

  // If QloHistory already exists, skip to avoid duplicates
  const anyHistory = await (prisma as any).qloHistory?.count?.() ?? 0
  if (anyHistory > 0) {
    console.log('   ℹ️ QloHistory already present, skipping time-series seeding...')
    return
  }

  // Create a small time-series for each user (~15-25 points over last 90 days)
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    const currentElo = u.qlo ?? 500
    const points = 15 + Math.floor(Math.random() * 10)
    let elo = Math.max(0, currentElo - 150 + Math.floor(Math.random() * 100))

    for (let p = points; p >= 1; p--) {
      const daysAgo = Math.floor((90 / points) * p) + Math.floor(Math.random() * 2)
      const changedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      // Random walk
      const delta = Math.floor((Math.random() - 0.5) * 30)
      elo = Math.max(0, elo + delta)

      await (prisma as any).qloHistory.create({
        data: {
          userId: u.id,
          qlo: elo,
          changedAt,
          source: 'seed',
          note: 'Synthetic history'
        }
      })
    }

    // Ensure last point close to current elo
    await (prisma as any).qloHistory.create({
      data: {
        userId: u.id,
        qlo: currentElo,
        changedAt: now,
        source: 'seed',
        note: 'Current'
      }
    })

    if (i % 50 === 0) {
      console.log(`   Seeded QLO history for ${i + 1}/${users.length} users...`)
    }
  }

  console.log('   ✅ Seeded QloHistory time-series for users')
}

// Seed leaderboard groups with proper distribution for 9+1 user display
async function seedLeaderboardGroups(users: any[]) {
  const groupNames = [
    'Global Champions', 'Rising Stars', 'Quiz Masters', 'Brain Busters', 'Knowledge Seekers',
    'Study Squad', 'Trivia Titans', 'Smart Cookies', 'Fact Finders', 'Quiz Wizards',
    'Learning League', 'Genius Guild', 'Wisdom Warriors', 'Mind Menders', 'IQ Elite'
  ]

  // Create groups with varying sizes (10-50 members each)
  for (let i = 0; i < groupNames.length; i++) {
    const groupName = groupNames[i]
    
    // Check if group already exists
    const existingGroup = await prisma.group.findUnique({
      where: { name: groupName }
    })
    
    let group
    if (existingGroup) {
      group = existingGroup
      console.log(`   Group "${groupName}" already exists, updating memberships...`)
    } else {
      group = await prisma.group.create({
        data: {
          name: groupName,
          description: `A competitive leaderboard group for ${groupName.toLowerCase()}`
        }
      })
      console.log(`   Created group: ${groupName}`)
    }

    // Determine group size (10-50 members, with some groups having exactly 10 for testing)
    const groupSize = i < 3 ? 
      faker.number.int({ min: 8, max: 12 }) : // First 3 groups: 8-12 members (test small groups)
      faker.number.int({ min: 15, max: 50 })   // Other groups: 15-50 members

    // Select users for this group based on QLO similarity
    const sortedUsers = [...users].sort((a, b) => (b.qlo || 100) - (a.qlo || 100))
    const startIndex = Math.floor((i / groupNames.length) * sortedUsers.length)
    const endIndex = Math.min(startIndex + groupSize, sortedUsers.length)
    const groupUsers = sortedUsers.slice(startIndex, endIndex)

    // Add users to group (avoid duplicates)
    for (const user of groupUsers) {
      try {
        await prisma.groupMembership.upsert({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id
            }
          },
          update: {}, // No update needed if exists
          create: {
            userId: user.id,
            groupId: group.id,
            joinedAt: faker.date.between({ 
              from: user.createdAt, 
              to: new Date() 
            })
          }
        })
      } catch (error) {
        // Skip if duplicate constraint error
        console.log(`   Skipped duplicate membership for user ${user.id} in group ${group.name}`)
      }
    }

    console.log(`   Added ${groupUsers.length} members to "${groupName}"`)
  }

  // Ensure current user (if exists) is in at least 3 groups for testing
  const currentUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' }
  })
  
  if (currentUser) {
    const randomGroups = await prisma.group.findMany({
      take: 3,
      orderBy: { createdAt: 'asc' }
    })
    
    for (const group of randomGroups) {
      await prisma.groupMembership.upsert({
        where: {
          userId_groupId: {
            userId: currentUser.id,
            groupId: group.id
          }
        },
        update: {},
        create: {
          userId: currentUser.id,
          groupId: group.id
        }
      })
    }
    console.log(`   Ensured current user is in ${randomGroups.length} groups`)
  }

  console.log(`   ✅ Created ${groupNames.length} leaderboard groups with varied membership`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

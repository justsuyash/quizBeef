import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import type { QuizMode, Difficulty, QuestionType, SourceType, ProfileType, AccountType, AchievementCategory, AchievementRarity } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const TOTAL_USERS = 500 // Create many users for realistic leaderboards
const DAYS_OF_HISTORY = 90 // 3 months of realistic activity
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
  
  // Check if already seeded
  const existingUserCount = await prisma.user.count()
  if (existingUserCount >= TOTAL_USERS / 2) {
    console.log(`⚠️  Database already has ${existingUserCount} users. Skipping seeding to avoid duplicates.`)
    console.log('   To re-seed, clear the database first.')
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
  
  console.log(`🥇 Updating Elo ratings and user stats...`)
  await updateUserStats(users)

  console.log('✅ Database seeded successfully with realistic data!')
  console.log(`   - ${users.length} users across ${POPULAR_COUNTRIES.length} countries`)
  console.log(`   - ${documents.length} documents with questions`)
  console.log(`   - 90 days of quiz history per user`)
  console.log(`   - Achievements awarded based on performance`)
  console.log(`   - Realistic Elo rating distribution`)
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
    const eloRating = Math.round(faker.number.int({ min: 800, max: 2000 }) * 0.3 + 1200 * 0.7)
    
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        handle: faker.internet.userName().toLowerCase(),
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
        eloRating,
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
    
    // Create 1-3 folders per user
    const folderCount = faker.number.int({ min: 1, max: 3 })
    const folders = []
    
    for (let f = 0; f < folderCount; f++) {
      const folder = await prisma.folder.create({
        data: {
          userId: user.id,
          name: faker.helpers.arrayElement(CATEGORIES),
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
      const skillLevel = (user.eloRating - 800) / 1200 // 0-1 scale
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

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

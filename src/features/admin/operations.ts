import { exec } from 'child_process'
import { HttpError } from 'wasp/server'
import type { SeedDatabase } from 'wasp/server/operations'

export const seedDatabase: SeedDatabase<void, void> = async (args, context) => {
    // Allow seeding only for authenticated users in this environment
    if (!context.user) {
        throw new HttpError(401, 'You must be logged in to seed the database')
    }

    exec('npx ts-node ../../scripts/advanced-seeder.ts', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`)
            return
        }
        console.log(`stdout: ${stdout}`)
        if (stderr) console.error(`stderr: ${stderr}`)
    })
}

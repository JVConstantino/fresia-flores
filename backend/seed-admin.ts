import { prisma } from './src/prisma/client'

async function main() {
  const admin = await prisma.user.update({
    where: { email: 'admin@test.com' },
    data: { isAdmin: true },
  })
  console.log('Admin user updated:', admin)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

const prisma = require('./src/prisma')

async function main() {
  await prisma.category.create({
    data: { id: 'cat_prueba', name: 'Prueba', icon: 'star', order: 1 },
  })
  console.log(await prisma.category.findMany())
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
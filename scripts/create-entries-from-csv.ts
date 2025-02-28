const { prisma } = require('../src/lib/prisma')
const csv = require('csv-parse')
const fs = require('fs')

interface FailedRecord {
  code: string
  title: string
  group: string
  salary: number
  error: string
  type: 'category' | 'subcategory'
}

async function importOccupations() {
  const failedRecords: FailedRecord[] = []

  console.log('Deleting any existing records')
  await prisma.occupationSubCategory.deleteMany({})
  await prisma.occupationCategory.deleteMany({})
  
  const records = []
  console.log('Creating new records')
  // Read and parse CSV
  const parser = fs
    .createReadStream('./data/national_data.csv')
    .pipe(csv.parse({
      columns: true,
      skip_empty_lines: true
    }))

  for await (const record of parser) {
    records.push({
      code: record.OCC_CODE,
      title: record.OCC_TITLE,
      group: record.O_GROUP,
      salary: parseInt(record.A_MEDIAN.replace(',', ''))
    })
  }

  // Process categories first
  console.log('\n=== Creating Categories ===')
  for (const record of records) {
    if (record.group === 'major') {
      try {
        await prisma.occupationCategory.create({
          data: {
            name: record.title,
            occupation_code: record.code,
          }
        })
        console.log(`✅ Category: ${record.code} - ${record.title}`)
      } catch (error) {
        console.error(`❌ Failed Category: ${record.code} - ${record.title}`)
        failedRecords.push({
          ...record,
          error: error instanceof Error ? error.message : String(error),
          type: 'category'
        })
      }
    }
  }

  // Process subcategories
  console.log('\n=== Creating SubCategories ===')
  for (const record of records) {
    if (record.group === 'detailed') {
      const categoryPrefix = record.code.substring(0, 2)
      try {
        const category = await prisma.occupationCategory.findFirst({
          where: { 
            occupation_code: {
              startsWith: categoryPrefix
            }
          }
        })

        if (category) {
          await prisma.occupationSubCategory.create({
            data: {
              name: record.title,
              occupation_code: record.code,
              annual_salary: record.salary,
              category_id: category.id
            }
          })
          console.log(`✅ SubCategory: ${record.code} - ${record.title} (Parent: ${category.occupation_code})`)
        } else {
          console.error(`❌ No parent category found for: ${record.code} - ${record.title}`)
          failedRecords.push({
            ...record,
            error: 'No parent category found',
            type: 'subcategory'
          })
        }
      } catch (error) {
        console.error(`❌ Failed SubCategory: ${record.code} - ${record.title}`)
        failedRecords.push({
          ...record,
          error: error instanceof Error ? error.message : String(error),
          type: 'subcategory'
        })
      }
    }
  }

  // Save failed records to file
  if (failedRecords.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `failed-records-${timestamp}.json`
    fs.writeFileSync(fileName, JSON.stringify(failedRecords, null, 2))
    console.log(`\n${failedRecords.length} failed records saved to ${fileName}`)
  } else {
    console.log('\nAll records processed successfully!')
  }
}

importOccupations()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
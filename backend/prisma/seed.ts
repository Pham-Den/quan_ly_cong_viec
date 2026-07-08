import { PrismaClient } from '@prisma/client'

import { ensureWorkflowStatuses } from '../src/workflow/defaults.js'

const prisma = new PrismaClient()

async function main() {
  const project = await prisma.project.upsert({
    where: { code: 'PERSONAL' },
    create: {
      code: 'PERSONAL',
      name: 'Cong viec ca nhan',
      description: 'Du an mau cho viec quan ly task va branch ca nhan.',
    },
    update: {
      name: 'Cong viec ca nhan',
      description: 'Du an mau cho viec quan ly task va branch ca nhan.',
    },
  })

  const repository = await prisma.repository.upsert({
    where: {
      projectId_name: {
        projectId: project.id,
        name: 'repo-mau',
      },
    },
    create: {
      projectId: project.id,
      name: 'repo-mau',
      provider: 'GITLAB_SELF_HOSTED',
      defaultBranch: 'main',
      productionBranch: 'main',
      releaseBranchPattern: 'release/DDMMYYYY',
    },
    update: {
      provider: 'GITLAB_SELF_HOSTED',
      defaultBranch: 'main',
      productionBranch: 'main',
      releaseBranchPattern: 'release/DDMMYYYY',
    },
  })

  await prisma.project.update({
    where: { id: project.id },
    data: { defaultRepoId: repository.id },
  })

  await ensureWorkflowStatuses(prisma, project.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

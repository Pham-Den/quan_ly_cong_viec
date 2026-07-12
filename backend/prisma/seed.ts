import { PrismaClient } from '@prisma/client'

import { ensureSystemManagerSeed } from '../src/system-manager/seed.js'
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
      trustSourceBranch: 'main',
      developBranch: 'develop',
      featureNamePattern: 'feature/{jiraCode}',
      hotfixNamePattern: 'hotfix/{jiraCode}-{date}',
      featurePlannedTargets: '{develop},{activeRelease},{production}',
      hotfixPlannedTargets: '{activeRelease},{production}',
    },
    update: {
      provider: 'GITLAB_SELF_HOSTED',
      defaultBranch: 'main',
      productionBranch: 'main',
      releaseBranchPattern: 'release/DDMMYYYY',
      trustSourceBranch: 'main',
      developBranch: 'develop',
      featureNamePattern: 'feature/{jiraCode}',
      hotfixNamePattern: 'hotfix/{jiraCode}-{date}',
      featurePlannedTargets: '{develop},{activeRelease},{production}',
      hotfixPlannedTargets: '{activeRelease},{production}',
    },
  })

  const now = new Date()
  const releaseName = `release/${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`

  const releaseCycle = await prisma.releaseCycle.upsert({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: releaseName,
      },
    },
    create: {
      repositoryId: repository.id,
      name: releaseName,
      status: 'ACTIVE',
    },
    update: {
      status: 'ACTIVE',
    },
  })

  const releaseBranch = await prisma.branch.upsert({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: releaseName,
      },
    },
    create: {
      repositoryId: repository.id,
      releaseCycleId: releaseCycle.id,
      name: releaseName,
      branchType: 'RELEASE',
      status: 'MERGED_RELEASE',
      checkoutSourceBranch: 'main',
      baseBranch: 'main',
      intendedMergeTarget: 'main',
      generatedCheckoutCommand: `git fetch origin && git checkout main && git pull origin main && git checkout -b ${releaseName}`,
    },
    update: {
      releaseCycleId: releaseCycle.id,
      branchType: 'RELEASE',
      checkoutSourceBranch: 'main',
      baseBranch: 'main',
      intendedMergeTarget: 'main',
      generatedCheckoutCommand: `git fetch origin && git checkout main && git pull origin main && git checkout -b ${releaseName}`,
    },
  })

  await prisma.branch.update({
    where: { id: releaseBranch.id },
    data: { lineageId: releaseBranch.lineageId ?? releaseBranch.id },
  })

  await prisma.project.update({
    where: { id: project.id },
    data: { defaultRepoId: repository.id },
  })

  await ensureWorkflowStatuses(prisma, project.id)
  await ensureSystemManagerSeed(prisma)
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

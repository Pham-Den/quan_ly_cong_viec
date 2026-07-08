import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const taskStatuses = [
  ['INBOX', 'Inbox', '#8c8c8c'],
  ['PLANNED', 'Chua lam', '#64748b'],
  ['IN_PROGRESS', 'Dang tien hanh', '#1677ff'],
  ['IN_REVIEW', 'Dang review', '#13c2c2'],
  ['TESTING', 'Dang test', '#faad14'],
  ['READY_RELEASE', 'San sang release', '#722ed1'],
  ['MERGED_RELEASE', 'Da vao release', '#9254de'],
  ['READY_PROD', 'San sang main', '#2f54eb'],
  ['DONE', 'Done', '#52c41a'],
  ['BLOCKED', 'Blocked', '#f5222d'],
  ['CANCELLED', 'Cancelled', '#595959'],
] as const

const branchStatuses = [
  ['DRAFT', 'Nhap', '#8c8c8c'],
  ['CODING', 'Dang code', '#1677ff'],
  ['READY_REVIEW', 'Cho review', '#13c2c2'],
  ['REVIEWING', 'Dang review', '#08979c'],
  ['READY_TEST', 'Cho test', '#faad14'],
  ['TESTING', 'Dang test', '#d48806'],
  ['READY_RELEASE', 'San sang release', '#722ed1'],
  ['MERGED_RELEASE', 'Da vao release', '#9254de'],
  ['READY_MAIN', 'San sang main', '#2f54eb'],
  ['MERGED_MAIN', 'Da vao main', '#52c41a'],
  ['CLOSED', 'Dong', '#595959'],
] as const

async function seedWorkflowStatuses(projectId: string) {
  const records = [
    ...taskStatuses.map(([key, label, color], index) => ({
      projectId,
      scope: 'TASK',
      key,
      label,
      color,
      sortOrder: index + 1,
    })),
    ...branchStatuses.map(([key, label, color], index) => ({
      projectId,
      scope: 'BRANCH',
      key,
      label,
      color,
      sortOrder: index + 1,
    })),
  ]

  for (const status of records) {
    await prisma.workflowStatus.upsert({
      where: {
        projectId_scope_key: {
          projectId: status.projectId,
          scope: status.scope,
          key: status.key,
        },
      },
      create: status,
      update: {
        label: status.label,
        color: status.color,
        sortOrder: status.sortOrder,
        enabled: true,
      },
    })
  }
}

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

  await seedWorkflowStatuses(project.id)
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

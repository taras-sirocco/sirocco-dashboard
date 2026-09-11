import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Починає (або продовжує) відкриття зміни. НЕ прив'язано до календарного
 * дня — зміну можна відкривати й закривати скільки завгодно разів за
 * день, кожен цикл отримує свій новий запис у shifts (пошук — по тому,
 * чи є незакрита, а не по даті). Відповідального завжди беремо з сесії,
 * НІКОЛИ з тіла запиту — інакше будь-хто міг би відкрити зміну від
 * чужого імені.
 */
export async function POST() {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Будь-яка ще не закрита зміна — включно з тією, чий чек-лист відкриття
  // досі не завершено (openedAt ще нема). Завершена й закрита сюди не
  // потрапляє ніколи, тож стару закриту зміну ми більше не перевикористовуємо.
  const existingShifts = await payload.find({
    collection: 'shifts',
    where: { closedAt: { exists: false } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })

  let shift = existingShifts.docs[0] ?? null

  if (shift?.openedAt) {
    // Уже повністю відкрита й ще не закрита — повертаємо як є, клієнт
    // веде користувача одразу на хаб, а не по чек-листу знову.
    return NextResponse.json({ shiftId: shift.id, alreadyOpen: true })
  }

  if (!shift) {
    // Нема жодної незакритої зміни — починаємо нову, незалежно від того,
    // скільки їх уже було сьогодні чи іншого дня.
    shift = await payload.create({
      collection: 'shifts',
      data: { date: new Date().toISOString(), responsibleUser: session.workerId },
      overrideAccess: true,
    })
  } else if (shift.responsibleUser !== session.workerId) {
    // Хтось інший почав чек-лист відкриття, але не закінчив — відповідальним
    // стає той, хто зараз реально його проходить.
    shift = await payload.update({
      collection: 'shifts',
      id: shift.id,
      data: { responsibleUser: session.workerId },
      overrideAccess: true,
    })
  }

  const template = await payload
    .find({
      collection: 'checklistTemplates',
      where: { type: { equals: 'opening' } },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)

  if (!template) {
    return NextResponse.json({ error: 'NO_TEMPLATE' }, { status: 500 })
  }

  const existingRuns = await payload.find({
    collection: 'checklistRuns',
    where: {
      and: [{ shift: { equals: shift.id } }, { template: { equals: template.id } }, { completedAt: { exists: false } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const run =
    existingRuns.docs[0] ??
    (await payload.create({
      collection: 'checklistRuns',
      data: { shift: shift.id, template: template.id, templateVersion: template.version ?? 1 },
      overrideAccess: true,
    }))

  return NextResponse.json({
    shiftId: shift.id,
    runId: run.id,
    alreadyOpen: false,
  })
}

/**
 * Демо-дані для перевірки екранів на реальному вмісті, а не заглушках.
 * Тексти й дані взяті дослівно з sirocco-prototypes/*.html.
 *
 * Запуск: npm run seed
 * Ідемпотентний — можна запускати повторно, існуючі записи оновлюються
 * (шукаються за природним ключем: ім'я / тип / title / key), а не дублюються.
 */
import { getPayload } from 'payload'

import config from './payload.config'
import { closingItems, openingItems } from './seed-data/checklistTemplates'
import { uiStrings } from './seed-data/uiStrings'
import { upsertChecklistTemplate } from './seed-data/upsertChecklistTemplate'

async function seed() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // ---- Workers (01-login.html `people`) ----
  const workersData = [
    { name: 'Андрій Мельник', role: 'worker' as const, pin: '1234' },
    { name: 'Богдан Кравець', role: 'worker' as const, pin: '2345' },
    { name: 'Максим Гнатюк', role: 'worker' as const, pin: '3456' },
    { name: 'Ігор Савчук', role: 'foreman' as const, pin: '4567' },
  ]
  for (const w of workersData) {
    const found = await payload.find({
      collection: 'workers',
      where: { name: { equals: w.name } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'workers',
        id: found.docs[0].id,
        data: { role: w.role, active: true, pin: w.pin },
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'workers',
        data: { name: w.name, role: w.role, active: true, pin: w.pin },
        overrideAccess: true,
      })
    }
  }
  console.log(`✓ workers: ${workersData.length}`)

  // ---- ChecklistTemplates: opening + closing (дані спільні з production-сідером) ----
  await upsertChecklistTemplate(payload, 'opening', openingItems)
  await upsertChecklistTemplate(payload, 'closing', closingItems)
  console.log('✓ checklistTemplates: opening, closing')

  // ---- Tasks: "Збірка лопаті, етап 1" (04-steps.html `proc` + 03-task.html target) ----
  const taskTitle = 'Збірка лопаті, етап 1'
  const taskData = {
    title: taskTitle,
    date: new Date().toISOString(),
    stageNo: 1,
    targetQty: 20,
    referenceNote: 'Зроби візуальне порівняння з еталонною деталлю на столі.',
    steps: [
      {
        title: 'Розкласти секції лопаті на столі за номерами',
        keyPoint: 'Стик 1 завжди зліва, маркування вгору',
        why: 'Інакше переплутаєш полярність і збереш дзеркально',
      },
      {
        title: 'Нанести клей по всьому периметру фланця',
        keyPoint: 'Шар рівний, без розривів. Працюєш поки клей відкритий — 8 хвилин',
        why: 'Розрив у шві дає протікання під навантаженням на висоті',
      },
      {
        title: 'Стягнути секції та затягнути 16 болтів хрест-навхрест',
        keyPoint: 'Момент 24 Н·м. Хрест-навхрест, не по колу',
        why: "По колу веде фланець, з'являється перекіс і вібрація",
      },
    ],
  }
  const existingTask = await payload.find({
    collection: 'tasks',
    where: { title: { equals: taskTitle } },
    limit: 1,
    overrideAccess: true,
  })
  if (existingTask.docs[0]) {
    await payload.update({
      collection: 'tasks',
      id: existingTask.docs[0].id,
      data: taskData,
      overrideAccess: true,
    })
  } else {
    await payload.create({ collection: 'tasks', data: taskData, overrideAccess: true })
  }
  console.log(`✓ tasks: ${taskTitle}`)

  // ---- ChangesLog (07-hub.html `changes`) ----
  const changesLogData = [
    {
      date: '2026-09-09',
      whatWasSaid: '«Клей застигає швидше, ніж 8 хвилин»',
      whatChanged: 'Перефасували клей на менші порції, оновили інструкцію: тепер 5 хвилин',
    },
    {
      date: '2026-09-08',
      whatWasSaid: '«Бракує розетки, тягнемо подовжувач через прохід»',
      whatChanged: 'Поставили другу розетку над столом, подовжувач прибрали',
    },
  ]
  for (const entry of changesLogData) {
    const found = await payload.find({
      collection: 'changesLog',
      where: { whatChanged: { equals: entry.whatChanged } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'changesLog',
        id: found.docs[0].id,
        data: entry,
        overrideAccess: true,
      })
    } else {
      await payload.create({ collection: 'changesLog', data: entry, overrideAccess: true })
    }
  }
  console.log(`✓ changesLog: ${changesLogData.length}`)

  // ---- uiStrings: повний набір текстів інтерфейсу з прототипів ----
  for (const s of uiStrings) {
    const found = await payload.find({
      collection: 'uiStrings',
      where: { key: { equals: s.key } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'uiStrings',
        id: found.docs[0].id,
        data: { value: s.value, note: s.note },
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'uiStrings',
        data: { key: s.key, value: s.value, note: s.note },
        overrideAccess: true,
      })
    }
  }
  console.log(`✓ uiStrings: ${uiStrings.length}`)

  console.log('\nГотово.')
}

// `payload run` dynamic-imports this module and exits as soon as module
// evaluation finishes — without a top-level await here it would exit before
// any of the async work below had a chance to run.
try {
  await seed()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}

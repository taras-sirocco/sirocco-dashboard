import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  labels: {
    singular: 'Задача',
    plural: 'Задачі',
  },
  // Нативне drag-to-reorder у списку — це і є черга задач на день,
  // без ручного проставляння чисел (Вимога 2).
  orderable: true,
  // Кнопка "Duplicate" у списку документів вже вбудована в Payload —
  // цим дублюється ціла задача разом з процедурою як шаблон.
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'taskType', 'targetQty', 'completedAt', 'date'],
    description:
      'Задача і її покрокова процедура редагуються тут-таки, в одному місці. Кроки — кнопкою "Add Step" нижче, перетягуванням міняються місцями, кнопкою на рядку — дублюються. Задача лишається в списку на планшеті, поки лічильник не досягне цілі (Completed at порожнє) — дата нижче більше не фільтрує видимість, це лише орієнтир планування.',
    group: 'Задачі',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Назва задачі',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Опис задачі',
      admin: {
        description:
          'Показується в картці задачі на планшеті, під назвою. Для задач-переробок сюди автоматично потрапляє коментар бригадира з перевірки якості.',
      },
    },
    {
      name: 'taskType',
      type: 'select',
      required: true,
      defaultValue: 'production',
      label: 'Тип задачі',
      options: [
        { label: 'Виробництво', value: 'production' },
        { label: 'Переробка (брак)', value: 'rework' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Переробка — задача, створена автоматично контролем якості бригадира (недобір по якості). Видно поміченою на планшеті.',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата (коли заплановано)',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        position: 'sidebar',
        description:
          'Орієнтир планування — на видимість задачі на планшеті більше не впливає (див. Completed at).',
      },
    },
    {
      name: 'stageNo',
      type: 'number',
      label: 'Номер етапу',
      admin: { position: 'sidebar' },
    },
    {
      name: 'targetQty',
      type: 'number',
      required: true,
      label: 'Ціль, шт',
      admin: { position: 'sidebar' },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Закрито (авто)',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
        description:
          'Проставляється автоматично, коли лічильник досягає цілі (done ≥ ціль). Порожньо — задача відкрита й показується на планшеті. Можна вручну очистити, щоб знову відкрити задачу.',
      },
    },
    {
      name: 'carriedFromTask',
      type: 'relationship',
      relationTo: 'tasks',
      label: 'Походить із задачі',
      admin: {
        position: 'sidebar',
        description:
          'Історично заповнювалось старою моделлю при копіюванні недобору на завтра (більше так не робиться). Тепер так само заповнюється автоматично для задач-переробок (Тип задачі = Переробка) — тут вихідна задача, з якої знайшли брак.',
      },
    },
    {
      type: 'collapsible',
      label: 'Процедура (TWI)',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'referenceNote',
          type: 'textarea',
          label: 'Інструкція звірки з еталоном',
          admin: {
            description:
              'Текст на останньому кроці процедури, напр. "Зроби візуальне порівняння з еталонною деталлю на столі".',
          },
        },
        {
          name: 'steps',
          type: 'array',
          label: 'Кроки',
          labels: {
            singular: 'Крок',
            plural: 'Кроки',
          },
          admin: {
            description: 'Перетягуй рядки, щоб змінити порядок кроку в інструкції.',
            initCollapsed: true,
            components: {
              RowLabel: '@/collections/Tasks/StepRowLabel#StepRowLabel',
            },
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Важливий крок',
            },
            {
              name: 'keyPoint',
              type: 'textarea',
              label: 'Ключовий момент',
            },
            {
              name: 'why',
              type: 'textarea',
              label: 'Чому це важливо',
            },
            {
              name: 'media',
              type: 'upload',
              relationTo: 'stepMedia',
              label: 'Фото / схема',
            },
          ],
        },
      ],
    },
  ],
}

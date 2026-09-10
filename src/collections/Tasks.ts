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
    defaultColumns: ['title', 'date', 'stageNo', 'targetQty'],
    description:
      'Задача і її покрокова процедура редагуються тут-таки, в одному місці. Кроки — кнопкою "Add Step" нижче, перетягуванням міняються місцями, кнопкою на рядку — дублюються.',
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
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата (на який день)',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        position: 'sidebar',
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
      name: 'carriedFromTask',
      type: 'relationship',
      relationTo: 'tasks',
      label: 'Перенесено з задачі (недобір)',
      admin: {
        position: 'sidebar',
        description: 'Заповнюється, коли залишок з учора переноситься на сьогодні.',
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
              relationTo: 'media',
              label: 'Фото / схема',
            },
          ],
        },
      ],
    },
  ],
}

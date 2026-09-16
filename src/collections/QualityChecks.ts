import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const QualityChecks: CollectionConfig = {
  slug: 'qualityChecks',
  labels: {
    singular: 'Перевірка якості',
    plural: 'Перевірки якості',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['shift', 'task', 'qtyDone', 'qtyAccepted', 'checkedBy', 'updatedAt'],
    description:
      'Контроль якості бригадиром: скільки із заявленого монтажником по задачі за конкретну зміну приймається. Одна перевірка на пару (зміна, задача) — повторне збереження РЕДАГУЄ той самий рядок (унікальний індекс shift+task, руками в міграції).',
    group: 'Якість',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  // Унікальність (shift, task) — щоб повторна перевірка тієї самої пари
  // редагувала наявний рядок, а не плодила дублікати. Індекс створюється
  // цим конфігом (drizzle push) і руками в migrations/*_add_quality_checks.ts
  // (прод іде через міграції, не push).
  indexes: [{ unique: true, fields: ['shift', 'task'] }],
  fields: [
    {
      name: 'shift',
      type: 'relationship',
      relationTo: 'shifts',
      required: true,
      label: 'Зміна',
    },
    {
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
      required: true,
      label: 'Задача',
    },
    {
      name: 'qtyDone',
      type: 'number',
      required: true,
      label: 'Заявлено монтажником (снапшот)',
      admin: {
        description: 'Сума прогресу по цій задачі саме за цю зміну — на момент перевірки.',
      },
    },
    {
      name: 'qtyAccepted',
      type: 'number',
      required: true,
      label: 'Прийнято по якості',
    },
    {
      name: 'comment',
      type: 'textarea',
      label: 'Коментар бригадира',
      admin: {
        description: 'Обов’язковий, якщо прийнято менше, ніж заявлено — стає описом задачі-переробки.',
      },
      // Умовна обов'язковість — той самий патерн, що й Workers.pin: не
      // field.required (це завжди NOT NULL у БД), а validate, що дивиться
      // на сусіднє поле.
      validate: (value: unknown, { siblingData }: any) => {
        const qtyDone = Number(siblingData?.qtyDone ?? 0)
        const qtyAccepted = Number(siblingData?.qtyAccepted ?? 0)
        if (qtyAccepted < qtyDone && !String(value ?? '').trim()) {
          return 'Коментар обов’язковий, якщо прийнято менше, ніж заявлено'
        }
        return true
      },
    },
    {
      name: 'checkedBy',
      type: 'relationship',
      relationTo: 'workers',
      required: true,
      label: 'Перевірив (бригадир)',
    },
  ],
  timestamps: true,
}

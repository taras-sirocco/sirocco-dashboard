import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const TaskProgress: CollectionConfig = {
  slug: 'taskProgress',
  labels: {
    singular: 'Прогрес задачі',
    plural: 'Прогрес задач',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['task', 'shift', 'qtyDelta', 'createdAt'],
    description:
      'Інкременти "+N шт", а не одне число, що перезаписується — так історію можна відновити і додати облік по одиницях пізніше.',
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
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
      required: true,
      label: 'Задача',
    },
    {
      name: 'shift',
      type: 'relationship',
      relationTo: 'shifts',
      required: true,
      label: 'Зміна',
    },
    {
      name: 'worker',
      type: 'relationship',
      relationTo: 'workers',
      required: true,
      label: 'Хто зробив',
    },
    {
      name: 'qtyDelta',
      type: 'number',
      required: true,
      label: 'Скільки зроблено (+N)',
    },
    {
      name: 'unitIds',
      type: 'json',
      label: 'Ідентифікатори одиниць (резерв на майбутнє)',
      admin: {
        description: 'Поки не використовується — місце під поштучний облік пізніше.',
        condition: () => false,
      },
    },
  ],
  timestamps: true,
}

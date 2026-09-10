import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Shifts: CollectionConfig = {
  slug: 'shifts',
  labels: {
    singular: 'Зміна',
    plural: 'Зміни',
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'responsibleUser', 'openedAt', 'closedAt'],
    description: 'Одна зміна на дільниці — від відкриття до закриття.',
    group: 'Зміна',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'responsibleUser',
      type: 'relationship',
      relationTo: 'workers',
      required: true,
      label: 'Відповідальний за зміну',
    },
    {
      name: 'openedAt',
      type: 'date',
      label: 'Відкрито о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      label: 'Закрито о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'handoverOk',
      type: 'checkbox',
      label: 'Робоче місце прийнято без зауважень',
      admin: {
        description: 'Відповідь на останнє питання відкриття зміни.',
      },
    },
    {
      name: 'handoverNote',
      type: 'textarea',
      label: 'Причина неготовності (якщо handoverOk = ні)',
    },
  ],
}

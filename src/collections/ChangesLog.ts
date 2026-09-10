import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const ChangesLog: CollectionConfig = {
  slug: 'changesLog',
  labels: {
    singular: 'Запис «що змінили»',
    plural: '«Що змінили за вашими сигналами»',
  },
  admin: {
    useAsTitle: 'whatChanged',
    defaultColumns: ['date', 'whatWasSaid', 'whatChanged'],
    description:
      'Наповнюється вручну: що сказали монтажники і що зробили у відповідь. Без цього коментарі стають ящиком скарг — показується окремим екраном на планшеті.',
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
      name: 'whatWasSaid',
      type: 'textarea',
      required: true,
      label: 'Що сказали',
    },
    {
      name: 'whatChanged',
      type: 'textarea',
      required: true,
      label: 'Що зробили',
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const BroadcastAcks: CollectionConfig = {
  slug: 'broadcastAcks',
  labels: {
    singular: 'Підтвердження повідомлення',
    plural: 'Підтвердження повідомлень',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['broadcast', 'worker', 'shownAt', 'ackedAt'],
    description:
      'Час показу і час підтвердження модалки для кожного працівника — заповнюється застосунком.',
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
      name: 'broadcast',
      type: 'relationship',
      relationTo: 'broadcasts',
      required: true,
      label: 'Повідомлення/задача',
    },
    {
      name: 'worker',
      type: 'relationship',
      relationTo: 'workers',
      required: true,
      label: 'Хто отримав',
    },
    {
      name: 'shownAt',
      type: 'date',
      label: 'Показано о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'ackedAt',
      type: 'date',
      label: 'Підтверджено о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: 'Коментар',
    plural: 'Коментарі',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['shift', 'contextType', 'createdAt'],
    description:
      'Нотатки до процесу, зібрані за день. Показуються в аркуші дня як є — не редагуються, лише доповнюються.',
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
      label: 'Хто сказав',
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Текст',
    },
    {
      name: 'audioUrl',
      type: 'text',
      label: 'Аудіозапис (URL)',
    },
    {
      name: 'transcript',
      type: 'textarea',
      label: 'Транскрипція',
      admin: {
        description: 'Заповнюється Whisper API при синхронізації.',
      },
    },
    {
      name: 'contextType',
      type: 'select',
      label: 'Контекст',
      options: [
        { label: 'Задача', value: 'task' },
        { label: 'Крок процедури', value: 'step' },
        { label: 'Загальне', value: 'general' },
      ],
      defaultValue: 'general',
    },
    {
      name: 'contextId',
      type: 'text',
      label: 'ID контексту',
      admin: {
        description: 'id задачі або кроку, якщо contextType не "загальне".',
      },
    },
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      label: 'Фото / відео',
    },
  ],
  timestamps: true,
}

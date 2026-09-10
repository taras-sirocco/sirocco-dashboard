import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Blockers: CollectionConfig = {
  slug: 'blockers',
  labels: {
    singular: 'Проблема/недобір',
    plural: 'Проблеми та недобори',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['kind', 'task', 'shift', 'createdAt'],
    description:
      'Причини недобору, неготовності дільниці, критичних проблем і невідповідності еталону — все, що записує монтажник голосом/текстом у відповідних екранах.',
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
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Тип',
      options: [
        { label: 'Недобір цілі («Що завадило?»)', value: 'gap' },
        { label: 'Дільниця не готова (відкриття)', value: 'not_ready' },
        { label: 'Критична проблема', value: 'critical' },
        { label: 'Дефект (не відповідає еталону)', value: 'defect' },
      ],
    },
    {
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
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
      label: 'Хто повідомив',
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
      admin: {
        description: 'Заповнюється при синхронізації офлайн-запису.',
      },
    },
    {
      name: 'transcript',
      type: 'textarea',
      label: 'Транскрипція',
      admin: {
        description: 'Заповнюється Whisper API при синхронізації, не одразу під час запису.',
      },
    },
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      label: 'Фото / відео',
    },
    {
      name: 'qtyDone',
      type: 'number',
      label: 'Зроблено (для недобору)',
    },
    {
      name: 'targetQty',
      type: 'number',
      label: 'Ціль (для недобору)',
    },
  ],
  timestamps: true,
}

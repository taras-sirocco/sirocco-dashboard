import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const ChecklistAnswers: CollectionConfig = {
  slug: 'checklistAnswers',
  labels: {
    singular: 'Відповідь чек-листа',
    plural: 'Відповіді чек-листів',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['run', 'itemKey', 'status', 'answeredAt'],
    description: 'Одна відповідь (так/ні) на один пункт чек-листа. Заповнюється застосунком.',
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
      name: 'run',
      type: 'relationship',
      relationTo: 'checklistRuns',
      required: true,
      label: 'Проходження',
    },
    {
      name: 'itemKey',
      type: 'text',
      required: true,
      label: 'Ключ пункту',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Статус',
      options: [
        { label: 'Так / все гаразд', value: 'ok' },
        { label: 'Ні / проблема', value: 'problem' },
      ],
    },
    {
      name: 'photo',
      type: 'relationship',
      relationTo: 'media',
      label: 'Фото',
      admin: {
        description: 'Обов’язково для пунктів закриття з requiresPhoto.',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Примітка / причина',
    },
    {
      name: 'answeredAt',
      type: 'date',
      label: 'Відповідано о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}

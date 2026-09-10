import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const ChecklistRuns: CollectionConfig = {
  slug: 'checklistRuns',
  labels: {
    singular: 'Проходження чек-листа',
    plural: 'Проходження чек-листів',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['shift', 'template', 'templateVersion', 'completedAt'],
    description:
      'Один прохід чек-листа (відкриття або закриття) в межах конкретної зміни. Заповнюється застосунком, тут — лише для перегляду історії.',
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
      name: 'template',
      type: 'relationship',
      relationTo: 'checklistTemplates',
      required: true,
      label: 'Шаблон',
    },
    {
      name: 'templateVersion',
      type: 'number',
      required: true,
      label: 'Версія шаблону на момент проходження',
      admin: {
        description: 'Фіксується автоматично — щоб історію можна було звірити навіть після правки шаблону.',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Завершено о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}

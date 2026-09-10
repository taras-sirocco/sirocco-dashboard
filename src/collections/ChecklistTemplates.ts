import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const ChecklistTemplates: CollectionConfig = {
  slug: 'checklistTemplates',
  labels: {
    singular: 'Шаблон чек-листа',
    plural: 'Шаблони чек-листів',
  },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'version', 'updatedAt'],
    description:
      'Питання відкриття/закриття зміни. Порядок пунктів — перетягуванням. Версія оновлюється автоматично при зміні пунктів, щоб історія старих відповідей лишалась порівнюваною.',
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
      name: 'type',
      type: 'select',
      required: true,
      label: 'Тип',
      options: [
        { label: 'Відкриття зміни', value: 'opening' },
        { label: 'Закриття зміни', value: 'closing' },
      ],
    },
    {
      name: 'version',
      type: 'number',
      label: 'Версія',
      defaultValue: 1,
      admin: {
        readOnly: true,
        description: 'Змінюється автоматично при редагуванні пунктів нижче.',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Пункти',
      minRows: 1,
      labels: {
        singular: 'Пункт',
        plural: 'Пункти',
      },
      admin: {
        description: 'Перетягуй, щоб змінити порядок. Кожен пункт — окреме питання так/ні.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          label: 'Ключ',
          admin: {
            description: 'Технічний ідентифікатор пункту, напр. "battery_charging". Не показується працівнику.',
          },
        },
        {
          name: 'text',
          type: 'text',
          required: true,
          label: 'Текст питання',
        },
        {
          name: 'requiresPhoto',
          type: 'checkbox',
          defaultValue: false,
          label: 'Обов’язкове фото',
          admin: {
            description: 'Тільки для закриття зміни: без фото пункт не зараховується.',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation === 'create') {
          data.version = 1
          return data
        }
        if (operation === 'update' && originalDoc) {
          const itemsChanged = JSON.stringify(originalDoc.items ?? []) !== JSON.stringify(data.items ?? [])
          if (itemsChanged) {
            data.version = (originalDoc.version ?? 1) + 1
          }
        }
        return data
      },
    ],
  },
}

import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const UiStrings: CollectionConfig = {
  slug: 'uiStrings',
  labels: {
    singular: 'Текст інтерфейсу',
    plural: 'Тексти інтерфейсу',
  },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'value'],
    listSearchableFields: ['key', 'value'],
    description:
      'Кожен напис в застосунку — заголовки, підписи кнопок, підказки. Ключ визначає екран: усе, що починається на "login.", належить екрану входу, "opening." — відкриттю зміни, і так далі. Шукай через поле пошуку зверху списку.',
    group: 'Тексти інтерфейсу',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      label: 'Ключ',
      admin: {
        description: 'Напр. login.title, opening.done_button, closing.confirm.',
      },
    },
    {
      name: 'value',
      type: 'textarea',
      required: true,
      label: 'Текст',
    },
    {
      name: 'note',
      type: 'text',
      label: 'Нотатка для себе',
      admin: {
        description: 'Необов’язково: де саме на екрані це з’являється, якщо ключ не очевидний.',
      },
    },
  ],
  // Якщо ключа немає в базі — застосунок показує сам ключ замість тексту,
  // а не падає. Ця поведінка реалізована у фронтенд-хелпері читання рядків,
  // не тут (див. крок «екрани застосунку»).
}

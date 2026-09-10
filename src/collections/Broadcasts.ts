import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Broadcasts: CollectionConfig = {
  slug: 'broadcasts',
  labels: {
    singular: 'Повідомлення/задача',
    plural: 'Повідомлення та задачі',
  },
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['kind', 'body', 'createdBy', 'createdAt'],
    description:
      'Модальне повідомлення (світло-сіре, «Прочитано») або нова задача (жовта, «Прийнято») — показується на весь екран на планшеті, поки не підтверджено.',
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
        { label: 'Повідомлення (до відома)', value: 'message' },
        { label: 'Нова задача (змінилась робота на сьогодні)', value: 'task' },
      ],
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      label: 'Текст',
    },
    {
      name: 'extra',
      type: 'textarea',
      label: 'Додатково',
      admin: {
        description: 'Напр. «Ціль: 14 шт. Перед закриттям зміни».',
      },
    },
    {
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
      label: 'Пов’язана задача',
      admin: {
        description: 'Тільки для типу «Нова задача» — задачу створи заздалегідь у колекції Задачі.',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: ['users', 'workers'],
      required: true,
      label: 'Від кого (як показати на планшеті)',
      admin: {
        description: 'Тарас (CEO) або бригадир — як підпишеться відправник у модалці.',
      },
    },
  ],
  timestamps: true,
}

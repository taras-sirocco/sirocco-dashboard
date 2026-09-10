import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { hashPin } from '../utilities/pin'

export const Workers: CollectionConfig = {
  slug: 'workers',
  labels: {
    singular: 'Монтажник/бригадир',
    plural: 'Монтажники та бригадири',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'active'],
    description:
      'Список людей, які входять на планшеті за іменем і 4-значним PIN. Не плутати з Users — це адмінський вхід у Payload.',
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
      name: 'name',
      type: 'text',
      required: true,
      label: "Ім'я",
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'worker',
      label: 'Роль',
      options: [
        { label: 'Монтажник', value: 'worker' },
        { label: 'Бригадир', value: 'foreman' },
      ],
      admin: {
        description: 'Наразі лише підпис у списку входу — без різниці у правах на планшеті.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активний',
      admin: {
        description: 'Вимкни, якщо людина більше не працює — зникне зі списку входу на планшеті.',
      },
    },
    {
      name: 'pin',
      type: 'text',
      virtual: true,
      label: 'Новий PIN',
      admin: {
        description:
          '4 цифри. Введи, щоб встановити або змінити PIN. Залиш порожнім, щоб не чіпати поточний — поточний PIN ніде не показується.',
        position: 'sidebar',
      },
      validate: (value: unknown, { operation, siblingData }: any) => {
        if (!value) {
          if (operation === 'create' && !siblingData?.pinHash) {
            return 'PIN обов’язковий при створенні (4 цифри)'
          }
          return true
        }
        if (!/^\d{4}$/.test(String(value))) {
          return 'PIN має складатися рівно з 4 цифр'
        }
        return true
      },
    },
    {
      name: 'pinHash',
      type: 'text',
      hidden: true,
      access: {
        create: () => false,
        update: () => false,
        read: () => false,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.pin) {
          data.pinHash = hashPin(String(data.pin))
        }
        delete data?.pin
        return data
      },
    ],
  },
}

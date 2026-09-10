import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Адміністратор',
    plural: 'Адміністратори',
  },
  admin: {
    useAsTitle: 'email',
    description: 'Вхід у Payload-адмінку (email+пароль). Не плутати з Workers — монтажники входять на планшеті за PIN.',
    group: 'Адмін',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
      label: "Ім'я",
      admin: {
        description: 'Показується як відправник у модалках повідомлень на планшеті (напр. "Тарас Водяний · CEO").',
      },
    },
  ],
}

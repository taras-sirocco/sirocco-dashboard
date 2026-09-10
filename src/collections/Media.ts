import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Медіа',
  },
  access: {
    // Серед файлів будуть фото робочих місць/вузлів — це не публічний контент.
    // Payload сам не бачить PIN-сесію планшета (BFF-архітектура), тому
    // "публічне для сесії" тут неможливе технічно: або відкрито всім в
    // інтернеті, або тільки req.user (адмінка). Показ фото на планшеті йде
    // через авторизований проксі-роут БФФ (Local API), не напряму звідси.
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Опис (для доступності)',
    },
    {
      name: 'type',
      type: 'select',
      label: 'Тип',
      defaultValue: 'photo',
      options: [
        { label: 'Фото', value: 'photo' },
        { label: 'Відео', value: 'video' },
        { label: 'Аудіо', value: 'audio' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      label: 'Джерело',
      options: [
        { label: 'Крок інструкції', value: 'task_step' },
        { label: 'Чек-лист закриття', value: 'closing_checklist' },
        { label: 'Проблема / недобір', value: 'blocker' },
        { label: 'Коментар', value: 'comment' },
        { label: 'Повідомлення/задача', value: 'broadcast' },
        { label: 'Завантажено в адмінці', value: 'admin' },
      ],
      defaultValue: 'admin',
    },
    {
      name: 'takenAt',
      type: 'date',
      label: 'Знято о',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'shift',
      type: 'relationship',
      relationTo: 'shifts',
      label: 'Зміна',
    },
  ],
  upload: true,
}

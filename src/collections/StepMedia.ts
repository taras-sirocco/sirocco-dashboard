import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

/**
 * Фото/схеми для кроків інструкції (Tasks.steps.media) — навмисно окрема
 * від Media колекція. Media спроєктована під планшетні фото (закриття
 * зміни, дефекти): опис/тип/джерело обов'язкові й доречні там, але
 * зайві тут — адміну треба просто перетягнути картинку в крок, без
 * жодного додаткового поля. Немає й реальної причини ховати ці фото:
 * це інструктивний контент, який адмін сам обирає показати всім
 * монтажникам, а не знімок цеху/дефекту.
 */
export const StepMedia: CollectionConfig = {
  slug: 'stepMedia',
  labels: {
    singular: 'Фото кроку',
    plural: 'Фото кроків',
  },
  admin: {
    useAsTitle: 'filename',
    description: 'Тільки файл — без опису, типу чи джерела. Використовується в кроках інструкції задач.',
    group: 'Медіа',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [],
  upload: true,
}

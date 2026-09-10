/**
 * Повний набір текстів інтерфейсу, дослівно з sirocco-prototypes/*.html.
 * Групи в ключах: login.*, opening.*, task.*, steps.*, close.*, blocker.*,
 * hub.* — по одному екрану з ТЗ. shared.* — наскрізні елементи (шапка,
 * кнопки нотатки/критичної проблеми, голосовий запис), які повторюються
 * на кількох екранах буквально однаковим текстом.
 *
 * {фігурні дужки} — місце для підстановки значення в коді (ім'я, число,
 * час тощо), не для редагування в адмінці.
 */
export const uiStrings: { key: string; value: string; note?: string }[] = [
  // ---------- shared.* (наскрізні елементи) ----------
  {
    key: 'shared.shift_status_bar',
    value: 'Зміна відкрита · Відповідальний — {name}',
    note: 'Рядок під шапкою на всіх екранах після відкриття зміни. {name} — ім’я відповідального.',
  },
  { key: 'shared.dock_note', value: 'Додати нотатку до процесу' },
  { key: 'shared.dock_critical', value: 'Повідомити про критичну проблему' },
  { key: 'shared.back', value: 'Назад' },
  { key: 'shared.back_link', value: '‹ Назад', note: 'З шевроном — використовується на екранах хабу.' },
  {
    key: 'shared.voice_hint_idle',
    value: 'Натисни і скажи. Так швидше, ніж друкувати',
    note: 'Підказка під мікрофоном до початку запису (відкриття зміни, «що завадило»).',
  },
  { key: 'shared.voice_hint_recording', value: 'Записую. Натисни ще раз, щоб зупинити' },
  { key: 'shared.voice_hint_unavailable', value: 'Мікрофон недоступний — напиши текстом' },
  { key: 'shared.mic_aria_label', value: 'Записати голосом', note: 'Для читачів з екрана (aria-label кнопки мікрофона).' },
  { key: 'shared.text_placeholder_short', value: 'або напиши коротко', note: 'Плейсхолдер текстового поля під мікрофоном.' },
  { key: 'shared.network_online', value: 'Мережа є', note: 'Підказка (title) на індикаторі мережі в шапці.' },
  { key: 'shared.network_offline', value: 'Працюємо офлайн', note: 'Підказка (title) на індикаторі мережі в шапці.' },

  // ---------- login.* (01-login.html) ----------
  { key: 'login.title', value: 'Відповідальний за зміну' },
  { key: 'login.role_worker', value: 'Монтажник' },
  { key: 'login.role_foreman', value: 'Бригадир' },
  { key: 'login.not_me', value: 'Це не я' },
  { key: 'login.pin_incomplete', value: 'Введи чотири цифри' },
  { key: 'login.pin_wrong', value: 'Код не підходить. Спробуй ще раз' },
  { key: 'login.pin_clear', value: 'Стерти' },
  { key: 'login.pin_submit', value: 'Вхід' },
  { key: 'login.welcome', value: 'Вітаю, {name}', note: '{name} — ім’я відповідального (тільки перше ім’я).' },
  { key: 'login.opening_shift', value: 'Відкриваємо зміну…' },

  // ---------- opening.* (02-opening.html) ----------
  {
    key: 'opening.responsible_eyebrow',
    value: '{name} · відповідальний',
    note: '{name} — ім’я відповідального за зміну.',
  },
  { key: 'opening.title', value: 'Відкриваємо зміну' },
  {
    key: 'opening.intro',
    value:
      'Сім питань про робоче місце. По одному на екран.<br>Якщо щось не так — тисни «Не можу», зміна не зупиниться.',
    note:
      'У прототипі текст згадує кнопку «Не можу», хоча сама кнопка підписана «Ні» — залишено дослівно, варто звірити з Тарасом перед показом працівникам.',
  },
  { key: 'opening.start_button', value: 'Почати' },
  { key: 'opening.progress_template', value: '{n} з {total}', note: 'Лічильник над смугою прогресу чек-листа відкриття.' },
  { key: 'opening.yes', value: 'Так' },
  { key: 'opening.no', value: 'Ні' },
  { key: 'opening.problem_eyebrow', value: 'Проблема' },
  { key: 'opening.problem_title', value: 'Що саме не так?' },
  { key: 'opening.problem_send', value: 'Відправити і продовжити' },
  { key: 'opening.handover_eyebrow', value: 'Останнє питання' },
  { key: 'opening.handover_question', value: 'Робоче місце після попередньої зміни відповідає?' },
  {
    key: 'opening.handover_note',
    value: 'Робимо систему кращою, щоб проблема не переїхала далі непоміченою.',
  },
  { key: 'opening.handover_yes', value: 'Так, приймаю' },
  { key: 'opening.not_ready_eyebrow', value: 'Дільниця не готова' },
  { key: 'opening.not_ready_title', value: 'Вкажіть причину' },
  { key: 'opening.not_ready_send', value: 'Повідомити про неготовність дільниці' },
  {
    key: 'opening.not_ready_sent_confirmation',
    value: 'Термінове повідомлення про неготовність дільниці відправлено Тарасу й бригадиру',
  },
  { key: 'opening.done_eyebrow', value: 'Зміну відкрито · відповідальний' },
  { key: 'opening.to_tasks', value: 'До задач на сьогодні' },
  {
    key: 'opening.dock_critical_call',
    value: 'Дзвінок відповідальному / бригадиру',
    note: 'У прототипі кнопка критичної проблеми на екрані відкриття веде на дзвінок, а не на повний екран нотатки — уточнити поведінку при збірці екрана.',
  },

  // ---------- task.* (03-task.html) ----------
  { key: 'task.progress_label', value: 'Зроблено сьогодні' },
  { key: 'task.instructions_button', value: 'Інструкція по кроках' },
  { key: 'task.done_button', value: 'Готово' },
  { key: 'task.done_button_with_progress', value: 'Готово, записати кількість' },
  { key: 'task.qty_prompt', value: 'Скільки зробили щойно?' },
  { key: 'task.qty_confirm', value: 'Підтвердити' },
  { key: 'task.all_done_title', value: 'Усі задачі на сьогодні зроблено' },
  { key: 'task.all_done_sub', value: 'Час переходити до аркуша дня і закриття зміни' },
  { key: 'task.to_daily_sheet', value: 'До аркуша дня' },
  { key: 'task.position_template', value: 'Задача {n} з {total}', note: '{n} — номер поточної задачі, {total} — всього задач у черзі.' },
  { key: 'task.progress_of_template', value: 'з {target}', note: 'Другий, дрібніший рядок лічильника: "{done} " + це поруч, напр. "6 з 20".' },

  // ---------- steps.* (04-steps.html) ----------
  { key: 'steps.important_step_label', value: 'Важливий крок' },
  { key: 'steps.position_template', value: 'Крок {n} з {total}' },
  { key: 'steps.media_placeholder', value: '📷 фото / схема кроку' },
  { key: 'steps.key_point_label', value: 'Ключовий момент' },
  { key: 'steps.why_label', value: 'Чому' },
  { key: 'steps.next_button', value: 'Далі' },
  { key: 'steps.reference_check_label', value: 'Звірка з еталоном' },
  { key: 'steps.quality_control_label', value: 'Контроль якості' },
  { key: 'steps.reference_check_title', value: 'Порівняй з еталонною деталлю' },
  { key: 'steps.reference_yes', value: 'Так, відповідає' },
  { key: 'steps.reference_no', value: 'Ні, не відповідає' },
  {
    key: 'steps.reference_yes_confirmation',
    value: 'Деталь відповідає еталону. Повертаємось на екран задачі — фіксуємо кількість',
  },
  {
    key: 'steps.reference_no_confirmation',
    value: 'Деталь не відповідає — запис причини (голос/текст) і сигнал відповідальному',
  },

  // ---------- close.* (05-close.html) ----------
  { key: 'close.context_task', value: 'Задача', note: 'Позначка контексту коментаря.' },
  { key: 'close.context_step', value: 'Крок', note: 'Позначка контексту коментаря.' },
  { key: 'close.sheet_eyebrow', value: 'Кінець зміни' },
  { key: 'close.sheet_title', value: 'Аркуш дня' },
  { key: 'close.sheet_sub', value: 'Перевір, що зробили, і додай, якщо є що сказати.' },
  { key: 'close.sheet_section_tasks', value: 'Задачі' },
  { key: 'close.sheet_section_comments', value: 'Що сказали за день' },
  {
    key: 'close.sheet_comments_note',
    value: 'Це вже записано протягом дня. Нічого переписувати не треба.',
  },
  { key: 'close.add_voice', value: 'Додати голосом' },
  { key: 'close.add_text', value: 'Додати текстом' },
  { key: 'close.to_closing', value: 'Перейти до закриття зміни' },
  { key: 'close.badge_done', value: 'готово' },
  { key: 'close.badge_partial', value: 'частково' },
  { key: 'close.badge_not_started', value: 'не почато' },
  { key: 'close.qty_template', value: '{done} з {target}' },
  { key: 'close.of_target_template', value: 'з {target}', note: 'Дрібніший рядок поруч із done у списку задач аркуша дня.' },
  { key: 'close.add_send', value: 'Додати', note: 'Кнопка відправки нового коментаря (голос/текст) на аркуші дня.' },
  { key: 'close.checklist_eyebrow', value: 'Останнє перед виходом' },
  { key: 'close.checklist_title', value: 'Закриття зміни' },
  { key: 'close.checklist_sub', value: 'Пройди список. Три пункти потребують фото.' },
  {
    key: 'close.checklist_incomplete_error',
    value: 'Щось не збіглося — перевір, чи всі пункти позначені й фото на місці.',
    note: 'Показується, якщо сервер відхилив закриття (неповний чек-лист), хоча кнопка на клієнті виглядала активною.',
  },
  {
    key: 'close.photo_upload_failed',
    value: 'Не вдалося завантажити фото. Спробуй ще раз.',
    note: 'Показується, якщо запит на завантаження фото (камера) повернув помилку.',
  },
  { key: 'close.checklist_submit', value: 'Все зроблено, закрити зміну' },
  { key: 'close.photo_present', value: 'фото є' },
  { key: 'close.photo_required', value: 'фото' },
  { key: 'close.confirm_eyebrow', value: 'Підтвердження' },
  { key: 'close.confirm_title', value: 'Закриваєш зміну' },
  {
    key: 'close.confirm_sub',
    value: 'Ти — {name}. Час: {time}.<br>Після цього зміна закриється, аркуш піде в звіт.',
  },
  {
    key: 'close.confirm_note',
    value:
      'Наступна зміна прийме робоче місце за тим, що ти залишив. Незавершені вузли позначені на етапі.',
  },
  { key: 'close.confirm_button', value: 'Підтверджую, зміну закрито' },
  { key: 'close.confirm_back', value: 'Назад до списку' },
  { key: 'close.done_title', value: 'Зміну закрито' },
  { key: 'close.done_sub_template', value: '{time} · дякую за роботу' },

  // ---------- blocker.* (06-blocker.html, «Що завадило?») ----------
  { key: 'blocker.position_template', value: 'Недобір {n} з {total}' },
  { key: 'blocker.title', value: 'Що завадило?' },
  { key: 'blocker.qty_template', value: '{done} з {target}' },
  { key: 'blocker.of_target_template', value: 'з {target}', note: 'Дрібніший рядок поруч із великим числом done, напр. "14 з 20".' },
  { key: 'blocker.miss_template', value: '−{n}', note: '{n} — скільки бракує до цілі.' },
  {
    key: 'blocker.voice_hint_idle',
    value: 'Скажи своїми словами. Це не про провину — ми шукаємо, що в системі полагодити',
  },
  {
    key: 'blocker.carry_note_template',
    value: 'Залишок {qty} перенесеться на завтра автоматично',
  },
  { key: 'blocker.send_button', value: 'Відправити і далі' },
  {
    key: 'blocker.all_sent_confirmation',
    value: 'Причини відправлено. Залишки перенесено на завтра.\nДалі — закриття зміни.',
  },

  // ---------- hub.* (07-hub.html) ----------
  { key: 'hub.no_tasks', value: 'На сьогодні задач не призначено', note: 'Показується, якщо на дату немає жодної задачі.' },
  { key: 'hub.eyebrow', value: 'Головна зміни' },
  { key: 'hub.title', value: 'Сьогодні' },
  {
    key: 'hub.sub_template',
    value: '{total} задачі на день. {inProgress} ще в роботі.',
    note: 'В прототипі число узгоджене з відмінком вручну («Три задачі... Дві ще...») — при підстановці числа перевірити українську форму множини.',
  },
  { key: 'hub.current_task_label', value: 'Поточна задача' },
  { key: 'hub.current_task_template', value: '{title} · {done} з {target}' },
  { key: 'hub.current_task_meta', value: 'Задача {n} з {total} · залишилось {remaining}' },
  { key: 'hub.continue_button', value: 'Продовжити роботу' },
  { key: 'hub.changes_tile', value: 'Що змінили за вашими сигналами', note: 'Підпис плитки на хабі.' },
  { key: 'hub.close_shift_tile', value: 'Закрити зміну' },
  { key: 'hub.changes_eyebrow', value: 'Ваш голос працює' },
  { key: 'hub.changes_title', value: 'Що змінили за вашими сигналами', note: 'Заголовок сторінки (окремо від підпису плитки).' },
  {
    key: 'hub.changes_sub',
    value: 'Кожне, що ви сказали, ми розбираємо. Ось що вже зробили.',
  },
  { key: 'hub.note_eyebrow', value: 'Нотатка до процесу' },
  { key: 'hub.critical_eyebrow', value: 'Критична проблема' },
  { key: 'hub.note_title', value: 'Що хочеш сказати?' },
  { key: 'hub.critical_title', value: 'Що сталося?' },
  { key: 'hub.note_sub', value: 'Скажи голосом або напиши. Це потрапить у звіт дня.' },
  { key: 'hub.critical_sub', value: 'Це піде терміновим сигналом Тарасу й бригадиру одразу.' },
  { key: 'hub.mic_aria_label', value: 'Записати', note: 'Коротший варіант aria-label саме на екрані нотатки/проблеми.' },
  { key: 'hub.voice_hint_idle', value: 'Натисни і скажи', note: 'Коротший варіант підказки саме на цьому екрані (без другого речення).' },
  { key: 'hub.attach_button', value: '📷 Додати фото або відео' },
  { key: 'hub.attach_done', value: '📷 Медіа додано' },
  { key: 'hub.send_button', value: 'Відправити' },
  { key: 'hub.send_button_critical', value: 'Відправити терміново' },
  {
    key: 'hub.send_confirmation',
    value: 'Відправлено. Запис із контекстом (задача, час, хто) пішов у звіт / сигнал.',
  },
  { key: 'hub.modal_kind_message', value: 'Повідомлення' },
  { key: 'hub.modal_kind_task', value: 'Нова задача на сьогодні' },
  { key: 'hub.modal_from_admin_template', value: '{name} · CEO · щойно' },
  { key: 'hub.modal_from_foreman_template', value: '{name} · бригадир · щойно' },
  { key: 'hub.modal_ack_message', value: 'Прочитано' },
  { key: 'hub.modal_ack_task', value: 'Прийнято' },
]

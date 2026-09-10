/**
 * Пункти чек-листів відкриття й закриття — реальний контент застосунку
 * (не демо), однаковий у dev і production. Джерело: sirocco-prototypes/
 * 02-opening.html (`items`) і 05-close.html (`closeItems`).
 */
export type ChecklistItemData = { key: string; text: string; requiresPhoto: boolean }

export const openingItems: ChecklistItemData[] = [
  { key: 'ventilation_light', text: 'Провітрено, освітлення працює', requiresPhoto: false },
  { key: 'workspace_clean', text: 'Робоче місце прибране, стіл вільний', requiresPhoto: false },
  { key: 'tools_complete', text: 'Інструмент на місці, весь комплект', requiresPhoto: false },
  { key: 'batteries_charged', text: 'Акумулятори заряджені', requiresPhoto: false },
  { key: 'consumables_stocked', text: 'Розхідники на місці, вистачає на зміну', requiresPhoto: false },
  { key: 'parts_checked', text: 'Комплектація деталей перевірена по списку', requiresPhoto: false },
  { key: 'ops_sheet_present', text: 'Аркуш операції на цю зміну є на столі', requiresPhoto: false },
]

// Рівно 3 з 7 пунктів вимагають фото — узгоджено з користувачем окремо.
export const closingItems: ChecklistItemData[] = [
  { key: 'tools_put_away', text: 'Інструмент на місці, нічого не залишилось на столі', requiresPhoto: false },
  { key: 'batteries_charging', text: 'Акумулятори на зарядці', requiresPhoto: true },
  { key: 'consumables_closed', text: 'Розхідники закриті та прибрані', requiresPhoto: false },
  {
    key: 'unfinished_units_marked',
    text: 'Незавершені вузли позначені: на якому етапі зупинились',
    requiresPhoto: true,
  },
  { key: 'table_floor_clean', text: 'Стіл і підлога прибрані', requiresPhoto: true },
  { key: 'utilities_off', text: 'Вода / повітря / світло вимкнені', requiresPhoto: false },
  { key: 'doors_locked', text: 'Двері зачинені', requiresPhoto: false },
]

/**
 * Чисто клієнтський формат-хелпер — БЕЗ жодного імпорту Payload.
 * Навмисно окремо від uiStrings.ts (де є getPayload/payload.config):
 * якщо клієнтський компонент імпортує щось із файлу, який десь вище
 * тягне payload.config, бандлер затягує весь Payload (разом із
 * серверним кодом завантаження файлів) у клієнтський бандл.
 */
export type UiStringsMap = Record<string, string>

/**
 * Вимога 1: якщо ключа немає — показуємо сам ключ, а не падаємо і не
 * показуємо порожнє місце. {ім'я} у значенні підставляється з vars.
 */
export function t(strings: UiStringsMap, key: string, vars?: Record<string, string>): string {
  let value = strings[key] ?? key
  if (vars) {
    for (const [varKey, varValue] of Object.entries(vars)) {
      value = value.replaceAll(`{${varKey}}`, varValue)
    }
  }
  return value
}

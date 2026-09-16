/**
 * Вихідні Slack-сповіщення (App → Slack, нічого вхідного). Два канали, два
 * Incoming Webhook у env — якщо змінної нема, тип сповіщення тихо
 * пропускається (лог warn), основний потік це не зупиняє.
 *
 * Виклики notifyCritical/notifyReport з BFF-роутів мають бути обгорнуті в
 * `after()` (next/server) — щоб іти ПІСЛЯ відповіді планшету й не блокувати
 * її, але й не губитись, якщо serverless-інстанс замерзне одразу по response
 * (сирий fire-and-forget без after() на Vercel це не гарантує).
 */

type SlackBlock = Record<string, unknown>

type CriticalEvent =
  | { kind: 'critical_problem'; workerName: string; shiftDateLabel?: string; text: string }
  | { kind: 'opening_no'; workerName: string; itemText: string; reason?: string }
  | { kind: 'handover_not_ready'; workerName: string; reason?: string }
  | { kind: 'shift_auto_closed'; workerName: string; startedAt: string; autoClosedAt: string }

type ReportEvent =
  | { kind: 'shift_opened'; workerName: string }
  | {
      kind: 'shift_closed'
      workerName: string
      tasks: { title: string; done: number; targetQty: number; reason?: string }[]
    }
  | { kind: 'note'; workerName: string; text: string }
  | {
      kind: 'shift_quality_checked'
      workerName: string
      shiftDateLabel: string
      isUpdate: boolean
      tasks: { title: string; qtyDone: number; qtyAccepted: number; comment?: string }[]
    }

function formatDateTime(iso?: string): string {
  const date = iso ? new Date(iso) : new Date()
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** SLACK_CRITICAL_MENTIONS — кома-розділені `<@MEMBER_ID>`. Порожньо → `<!channel>`. */
function criticalMentionText(): string {
  const raw = process.env.SLACK_CRITICAL_MENTIONS?.trim()
  const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
  return ids.length > 0 ? ids.join(' ') : '<!channel>'
}

async function postToWebhook(
  envVarName: string,
  blocks: SlackBlock[],
  fallbackText: string,
): Promise<void> {
  const url = process.env[envVarName]
  if (!url) {
    console.warn(`[slack] ${envVarName} не задано — сповіщення «${fallbackText}» пропущено`)
    return
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fallbackText, blocks }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[slack] ${envVarName}: webhook відповів ${res.status} ${body}`.trim())
    }
  } catch (err) {
    console.error(`[slack] ${envVarName}: не вдалося відправити`, err)
  }
}

function criticalBlocks(headerText: string, fields: [string, string][], mention: string): SlackBlock[] {
  return [
    { type: 'header', text: { type: 'plain_text', text: headerText, emoji: true } },
    {
      type: 'section',
      fields: fields.map(([label, value]) => ({
        type: 'mrkdwn',
        text: `*${label}:*\n${value || '—'}`,
      })),
    },
    { type: 'section', text: { type: 'mrkdwn', text: `${mention} потрібна реакція зараз` } },
  ]
}

function reportBlocks(headerText: string, lines: string[]): SlackBlock[] {
  return [
    { type: 'section', text: { type: 'mrkdwn', text: `*${headerText}*\n${lines.join('\n')}` } },
  ]
}

export async function notifyCritical(event: CriticalEvent): Promise<void> {
  const mention = criticalMentionText()
  const time = formatDateTime()

  let headerText: string
  let fields: [string, string][]
  let fallbackText: string

  switch (event.kind) {
    case 'critical_problem':
      headerText = '🔴 Критична проблема'
      fields = [
        ['Хто', event.workerName],
        ['Зміна', event.shiftDateLabel ?? '—'],
        ['Суть', event.text],
        ['Час', time],
      ]
      fallbackText = `🔴 Критична проблема — ${event.workerName}`
      break
    case 'opening_no':
      headerText = '🔴 Проблема при відкритті зміни'
      fields = [
        ['Хто', event.workerName],
        ['Пункт чек-листа', event.itemText],
        ['Причина', event.reason ?? '—'],
        ['Час', time],
      ]
      fallbackText = `🔴 Проблема при відкритті зміни — ${event.workerName}`
      break
    case 'handover_not_ready':
      headerText = '🔴 Робоче місце не прийнято'
      fields = [
        ['Хто', event.workerName],
        ['Причина', event.reason ?? '—'],
        ['Час', time],
      ]
      fallbackText = `🔴 Робоче місце не прийнято — ${event.workerName}`
      break
    case 'shift_auto_closed':
      headerText = '🔴 Зміну не закрили вчасно'
      fields = [
        ['Відповідальний', event.workerName],
        ['Розпочато', formatDateTime(event.startedAt)],
        ['Автоматично закрито', formatDateTime(event.autoClosedAt)],
      ]
      fallbackText = `🔴 Зміну не закрили вчасно — ${event.workerName}`
      break
  }

  await postToWebhook('SLACK_WEBHOOK_URL_CRITICAL', criticalBlocks(headerText, fields, mention), fallbackText)
}

export async function notifyReport(event: ReportEvent): Promise<void> {
  const time = formatDateTime()

  let headerText: string
  let lines: string[]
  let fallbackText: string

  switch (event.kind) {
    case 'shift_opened':
      headerText = 'Зміну відкрито'
      lines = [`Відповідальний: ${event.workerName}`, `Час: ${time}`]
      fallbackText = `Зміну відкрито — ${event.workerName}`
      break
    case 'shift_closed': {
      headerText = 'Зміну закрито'
      const taskLines =
        event.tasks.length > 0
          ? event.tasks.map((t) =>
              t.done < t.targetQty
                ? `• ${t.title}: ${t.done}/${t.targetQty} — ${t.reason || 'причину не вказано'}`
                : `• ${t.title}: ${t.done}/${t.targetQty}`,
            )
          : ['Задач на сьогодні не було.']
      lines = [`Відповідальний: ${event.workerName}`, `Час: ${time}`, '', '*Підсумок задач:*', ...taskLines]
      fallbackText = `Зміну закрито — ${event.workerName}`
      break
    }
    case 'note':
      headerText = 'Нотатка'
      lines = [`Хто: ${event.workerName}`, `Час: ${time}`, '', event.text]
      fallbackText = `Нотатка — ${event.workerName}`
      break
    case 'shift_quality_checked': {
      headerText = `Перевірка якості${event.isUpdate ? ' (оновлено)' : ''}`
      const taskLines = event.tasks.map((t) =>
        t.qtyAccepted >= t.qtyDone
          ? `• ${t.title}: прийнято ${t.qtyAccepted}/${t.qtyDone}`
          : `• ⚠️ ${t.title}: зроблено ${t.qtyDone}, прийнято ${t.qtyAccepted} — ${t.comment || 'причину не вказано'}`,
      )
      lines = [
        `Бригадир: ${event.workerName}`,
        `Зміна: ${event.shiftDateLabel}`,
        `Час: ${time}`,
        '',
        '*Задачі:*',
        ...taskLines,
      ]
      fallbackText = `Перевірка якості — ${event.workerName}`
      break
    }
  }

  await postToWebhook('SLACK_WEBHOOK_URL_REPORTS', reportBlocks(headerText, lines), fallbackText)
}

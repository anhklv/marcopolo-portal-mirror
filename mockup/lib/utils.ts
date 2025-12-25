import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 日付フォーマット関数: ISO8601形式 → "2028年6月15日(月) 18:00"形式
export function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // 曜日を取得（0=日曜日, 1=月曜日, ..., 6=土曜日）
    const dayOfWeek = date.getDay();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[dayOfWeek];

    return `${year}年${month}月${day}日(${weekday}) ${hours}:${minutes}`;
  } catch (error) {
    return dateStr; // エラー時は元の文字列を返す
  }
}

// 日付フォーマット関数（曜日なし）: ISO8601形式 → "2024年12月1日 23:59"形式
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  } catch (error) {
    return dateStr; // エラー時は元の文字列を返す
  }
}

// 日付フォーマット関数（日付のみ）: "2024-01-15" → "2024年1月15日"形式
export function formatDate(dateStr: string): string {
  try {
    // yyyy-mm-dd形式の場合
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }
    // ISO8601形式の場合
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  } catch (error) {
    return dateStr; // エラー時は元の文字列を返す
  }
}

// メールテンプレート生成関数
interface EventData {
  title: string;
  description?: string;
  date?: string;
  timetable?: string;
  location?: string;
  note?: string;
}

// 案内メールテンプレート
export function getInviteEmailTemplate(event: EventData): { title: string; body: string } {
  const title = `【${event.title}】ご案内`;
  const body = `この度は、${event.title}にご案内いたします。

${event.description ? `【イベント概要】\n${event.description}\n\n` : ""}${event.date ? `【開催日時】\n${formatEventDate(event.date)}\n\n` : ""}${event.timetable ? `【タイムテーブル】\n${event.timetable}\n\n` : ""}${event.location ? `【場所】\n${event.location}\n\n` : ""}ご参加の可否について、以下のURLよりご回答をお願いいたします。
{RSVP_URL}

${event.note ? `【備考】\n${event.note}\n\n` : ""}よろしくお願いいたします。`;

  return { title, body };
}

// リマインドメールテンプレート
export function getRemindEmailTemplate(event: EventData): { title: string; body: string } {
  const title = `【${event.title}】参加可否のご回答をお願いします`;
  const body = `この度は、${event.title}にご案内いたしました。

${event.description ? `【イベント概要】\n${event.description}\n\n` : ""}${event.date ? `【開催日時】\n${formatEventDate(event.date)}\n\n` : ""}${event.timetable ? `【タイムテーブル】\n${event.timetable}\n\n` : ""}${event.location ? `【場所】\n${event.location}\n\n` : ""}まだ参加可否のご回答をいただいておりません。
お忙しい中恐縮ですが、以下のURLよりご回答をお願いいたします。

{RSVP_URL}

${event.note ? `【備考】\n${event.note}\n` : ""}よろしくお願いいたします。`;

  return { title, body };
}

// アンケートメールテンプレート（Googleフォーム用・非推奨）
export function getSurveyEmailTemplate(event: EventData): { title: string; body: string } {
  const title = `【${event.title}】アンケートのお願い`;
  const body = `この度は、${event.title}にご参加いただき、誠にありがとうございました。

今後のイベント改善のため、アンケートへのご協力をお願いいたします。
以下のURLよりご回答をお願いいたします。

{FORM_URL}

ご多忙の中恐縮ですが、よろしくお願いいたします。`;

  return { title, body };
}

// アンケート回答依頼メールテンプレート
export function getSurveyRequestEmailTemplate(event: EventData): { title: string; body: string } {
  const title = `${event.title} アンケートのお願い`;
  const body = `この度は、${event.title}にご参加いただき、ありがとうございました。

以下のURLよりアンケートにご回答いただけますと幸いです。
{SURVEY_URL}

ご協力のほど、よろしくお願いいたします。`;

  return { title, body };
}


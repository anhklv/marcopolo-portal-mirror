/** フォーム上の出欠選択値 */
export type FormRsvpStatus = "attend" | "online" | "decline";

/** DB status → フォーム status 変換 */
export function dbStatusToFormStatus(dbStatus: string): FormRsvpStatus | null {
  switch (dbStatus) {
    case "attending":
      return "attend";
    case "online":
      return "online";
    case "absent":
      return "decline";
    default:
      return null;
  }
}

/** フォーム status → DB status 変換 */
export function formStatusToDbStatus(
  formStatus: FormRsvpStatus
): "attending" | "online" | "absent" {
  switch (formStatus) {
    case "attend":
      return "attending";
    case "online":
      return "online";
    case "decline":
      return "absent";
  }
}

"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerBadges } from "@/components/ui/customer-badges";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { StepIndicator } from "../../invite/_components/step-indicator";
import type { StepConfig } from "../../invite/_components/step-indicator";
import type { SerializedEventForRemind } from "@/lib/types/serialized";
import type { useRemindForm } from "./use-remind-form";

const REMIND_STEPS: readonly StepConfig[] = [
  { key: "recipients", label: "送信先確認", number: 1 },
  { key: "email", label: "メール文作成", number: 2 },
  { key: "confirm", label: "確認", number: 3 },
  { key: "send", label: "送信", number: 4 },
] as const;

export { REMIND_STEPS };

interface StepRecipientsProps {
  event: SerializedEventForRemind;
  form: ReturnType<typeof useRemindForm>;
}

export function StepRecipients({ event, form }: StepRecipientsProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${event.id}`}
        title={event.title}
        description="未回答者へのリマインドメールを送信します。"
      />

      <StepIndicator currentStep={form.step} steps={REMIND_STEPS} />

      <div className="space-y-6">
        <div className="space-y-2 py-4">
          <SectionHeading>送信先確認</SectionHeading>
          <p className="text-base text-muted-foreground">
            未回答者
            <span className="font-bold text-foreground text-lg">
              {event.pendingCustomers.length}名
            </span>
            にリマインドメールを送信します。
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <ActionButton variant="outline" asChild>
            <Link href={`/admin/events/${event.id}`}>キャンセル</Link>
          </ActionButton>
          <ActionButton onClick={form.handleRecipientsNext}>次へ</ActionButton>
        </div>

        <div className="rounded-lg bg-card max-h-[60vh] overflow-y-auto">
          <Table className="[&_th]:py-4 [&_td]:py-4">
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>会員区分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.pendingCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}?from=event`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {customer.lastName} {customer.firstName}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap items-center">
                      <CustomerBadges
                        customerCommunities={customer.customerCommunities}
                        memberCategory={customer.memberCategory}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

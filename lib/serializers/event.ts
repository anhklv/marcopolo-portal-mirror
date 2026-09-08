// イベントデータのシリアライズ関数

import type { EventForDetail, EventForInvite, EventForList, EventForRemind } from "@/lib/repositories/event.repository";
import type { SerializedEvent, SerializedEventDetail, SerializedEventForInvite, SerializedEventForRemind } from "@/lib/types/serialized";

/**
 * イベント一覧用シリアライズ
 */
export function serializeEventForList(e: EventForList): SerializedEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    note: e.note,
    isPaused: e.isPaused,
    responseDeadline: e.responseDeadline?.toISOString() ?? null,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    attendeesCount: e._count.rsvps,
  };
}

/**
 * イベント詳細用シリアライズ
 */
export function serializeEventForDetail(e: EventForDetail): SerializedEventDetail {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    timetable: e.timetable,
    note: e.note,
    isPaused: e.isPaused,
    allowsOnline: e.allowsOnline,
    hasAfterParty: e.hasAfterParty,
    responseDeadline: e.responseDeadline?.toISOString() ?? null,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
      hasSurvey: e.community.hasSurvey,
    },
    rsvps: e.rsvps.map((r) => ({
      id: r.id,
      token: r.token,
      status: r.status,
      afterPartyStatus: r.afterPartyStatus,
      comment: r.comment,
      adminNote: r.adminNote,
      respondedAt: r.respondedAt?.toISOString() ?? null,
      customer: {
        id: r.customer.id,
        lastName: r.customer.lastName,
        firstName: r.customer.firstName,
        company: r.customer.company,
      },
    })),
  };
}

/**
 * イベント案内用シリアライズ
 */
export function serializeEventForInvite(e: EventForInvite): SerializedEventForInvite {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    timetable: e.timetable,
    note: e.note,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    rsvps: e.rsvps.map((r) => ({ customerId: r.customerId, status: r.status })),
  };
}

/**
 * イベントリマインド用シリアライズ
 */
export function serializeEventForRemind(e: EventForRemind): SerializedEventForRemind {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    timetable: e.timetable,
    note: e.note,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    pendingCustomers: e.rsvps.map((r) => ({
      id: r.customer.id,
      firstName: r.customer.firstName,
      lastName: r.customer.lastName,
      email: r.customer.email,
      subEmails: r.customer.subEmails ?? [],
      company: r.customer.company,
      memberCategory: r.customer.memberCategory,
      customerCommunities: r.customer.customerCommunities.map((cc) => ({
        communityId: cc.communityId,
        resignedAt: cc.resignedAt?.toISOString() ?? null,
        auditMemberType: cc.auditMemberType,
        auditMemberPremium: cc.auditMemberPremium,
        community: {
          code: cc.community.code,
          name: cc.community.name,
        },
      })),
    })),
  };
}

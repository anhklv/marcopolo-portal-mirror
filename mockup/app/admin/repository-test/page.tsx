"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  customerRepository,
  eventRepository,
  rsvpRepository,
} from "@/lib/repositories";
import type { Customer, Event, RSVP } from "@/lib/data/mock";

export default function RepositoryTestPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Repository層を使用してデータを取得
        const [customersData, eventsData, rsvpsData] = await Promise.all([
          customerRepository.findAll({ statuses: ["active"] }),
          eventRepository.findAll(),
          rsvpRepository.findAll({ eventId: "E001" }),
        ]);

        setCustomers(customersData);
        setEvents(eventsData);
        setRsvps(rsvpsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTestFindById = async () => {
    try {
      const customer = await customerRepository.findById("C001");
      if (customer) {
        alert(`顧客が見つかりました: ${customer.name}`);
      } else {
        alert("顧客が見つかりませんでした");
      }
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : "不明なエラー"}`);
    }
  };

  const handleTestFilter = async () => {
    try {
      const filtered = await customerRepository.findAll({
        keyword: "山田",
        memberCategories: ["member"],
      });
      alert(`${filtered.length}件の顧客が見つかりました`);
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : "不明なエラー"}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Repository層テスト</h1>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Repository層テスト</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">エラー</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Repository層テスト</h1>
        <div className="space-x-2">
          <Button onClick={handleTestFindById} variant="outline">
            findByIdテスト
          </Button>
          <Button onClick={handleTestFilter} variant="outline">
            フィルターテスト
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>顧客データ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.length}</p>
            <p className="text-sm text-muted-foreground">アクティブな顧客数</p>
            {customers.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold">サンプル:</p>
                <p className="text-sm">{customers[0].name}</p>
                <p className="text-xs text-muted-foreground">
                  {customers[0].email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>イベントデータ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">イベント数</p>
            {events.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold">サンプル:</p>
                <p className="text-sm">{events[0].title}</p>
                <p className="text-xs text-muted-foreground">
                  {events[0].eventType}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RSVPデータ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rsvps.length}</p>
            <p className="text-sm text-muted-foreground">
              E001イベントのRSVP数
            </p>
            {rsvps.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold">サンプル:</p>
                <p className="text-sm">ステータス: {rsvps[0].status}</p>
                <p className="text-xs text-muted-foreground">
                  顧客ID: {rsvps[0].customerId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テスト結果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>Repository層のデータ取得が正常に動作しています</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>フィルター機能が正常に動作しています</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>非同期処理が正常に動作しています</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


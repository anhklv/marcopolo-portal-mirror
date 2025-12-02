"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Send, Mail, Copy } from "lucide-react";
import { events, customers } from "@/lib/data/mock";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id) || events[0];
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const attendees = customers.map((c, i) => ({
    ...c,
    status: i % 3 === 0 ? "参加" : i % 3 === 1 ? "不参加" : "未回答",
    respondedAt: i % 3 !== 2 ? "2024-05-20 10:00" : "-",
  }));

  const handleSendInvite = () => {
    if (selectedCustomers.length === 0) {
      toast.error("招待する顧客を選択してください");
      return;
    }
    toast.success(`${selectedCustomers.length}名に招待メールを送信しました`);
    setSelectedCustomers([]);
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                <Badge variant={event.status === "open" ? "default" : "secondary"}>
                    {event.status === "open" ? "受付中" : "企画中"}
                </Badge>
            </div>
            <p className="text-muted-foreground">
                {event.date} @ {event.location}
            </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
            <Tabs defaultValue="attendees">
                <TabsList>
                    <TabsTrigger value="attendees">参加状況</TabsTrigger>
                    <TabsTrigger value="invite">招待・追送</TabsTrigger>
                </TabsList>
                
                <TabsContent value="attendees" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>参加者リスト</CardTitle>
                            <CardDescription>現在の回答状況です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>氏名</TableHead>
                                        <TableHead>会社名</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>回答日時</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.map((attendee) => (
                                        <TableRow key={attendee.id}>
                                            <TableCell>{attendee.name}</TableCell>
                                            <TableCell>{attendee.company}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    attendee.status === "参加" ? "default" : 
                                                    attendee.status === "不参加" ? "destructive" : "outline"
                                                }>
                                                    {attendee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{attendee.respondedAt}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invite" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>招待メール送信</CardTitle>
                            <CardDescription>
                                未招待の顧客を選択して招待メールを送信します。
                                <br/>
                                ※送信時に自動で個別ID付きURLが生成されます。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                                <div>
                                    <span className="font-medium">{selectedCustomers.length}名</span> 選択中
                                </div>
                                <Button onClick={handleSendInvite} disabled={selectedCustomers.length === 0}>
                                    <Send className="mr-2 h-4 w-4" />
                                    招待メールを送信
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">選択</TableHead>
                                        <TableHead>氏名</TableHead>
                                        <TableHead>会社名</TableHead>
                                        <TableHead>会員区分</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedCustomers.includes(customer.id)}
                                                    onCheckedChange={() => toggleCustomer(customer.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{customer.name}</TableCell>
                                            <TableCell>{customer.company}</TableCell>
                                            <TableCell>{customer.type}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>集計サマリ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">2</div>
                            <div className="text-xs text-green-800">参加</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">1</div>
                            <div className="text-xs text-red-800">不参加</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                            <div className="text-2xl font-bold text-gray-600">2</div>
                            <div className="text-xs text-gray-800">未回答</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>アクション</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                        <Mail className="mr-2 h-4 w-4" />
                        未回答者に再送
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={`/events/${id}/rsvp?token=demo-token`} target="_blank">
                            <Copy className="mr-2 h-4 w-4" />
                            回答URLをコピー (デモ)
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

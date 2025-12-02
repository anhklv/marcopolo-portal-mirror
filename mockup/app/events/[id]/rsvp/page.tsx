"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { events } from "@/lib/data/mock";

export default function RSVPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id) || events[0];
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"attend" | "decline" | null>(null);

  const handleSubmit = () => {
    if (!status) {
        toast.error("参加・不参加を選択してください");
        return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>回答を受け付けました</CardTitle>
            <CardDescription>
              ご回答ありがとうございます。
              {status === "attend" && (
                <>
                  <br />
                  当日お会いできるのを楽しみにしています。
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">この画面を閉じてください</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              招待状
            </span>
          </div>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
          <CardDescription className="mt-2 space-y-1 text-base">
            <p>日時: {event.date}</p>
            <p>場所: {event.location}</p>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-1">山田 太郎 様</p>
            <p className="text-muted-foreground">
                このURLはあなた専用です。他の方へ転送しないようご注意ください。
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-base">出欠を選択してください</Label>
            <RadioGroup onValueChange={(v) => setStatus(v as any)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="attend" id="attend" className="peer sr-only" />
                <Label
                  htmlFor="attend"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                >
                  <span className="text-xl mb-2">🙆‍♂️</span>
                  <span className="font-semibold">参加する</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="decline" id="decline" className="peer sr-only" />
                <Label
                  htmlFor="decline"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                >
                  <span className="text-xl mb-2">🙅‍♀️</span>
                  <span className="font-semibold">参加しない</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">メッセージ・連絡事項 (任意)</Label>
            <Textarea id="comment" placeholder="アレルギーや遅刻の連絡など..." />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button className="w-full" size="lg" onClick={handleSubmit}>
            回答を送信する
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

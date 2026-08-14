"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-button";
import { cn } from "@/lib/utils";
import type { ListingCategoryOption, MasterData } from "@/lib/types/serialized";
import { CustomerPreviewScreen } from "./customer-preview-screen";
import {
  INITIAL_PREVIEW_DATA,
  formatFileSize,
  isCsvFile,
  type PreviewCustomer,
} from "./customer-csv-types";

type UploadStatus = "idle" | "dragging" | "selected" | "uploading" | "preview";

interface CustomerCsvUploadProps {
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
}

export function CustomerCsvUpload(props: CustomerCsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [customers, setCustomers] =
    useState<PreviewCustomer[]>(INITIAL_PREVIEW_DATA);

  const selectFile = useCallback((selected: File) => {
    if (!isCsvFile(selected)) {
      toast.error("CSV形式のファイルのみアップロードできます");
      return;
    }
    setFile(selected);
    setStatus("selected");
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (status !== "uploading")
        setStatus((s) => (s === "preview" ? s : "dragging"));
    },
    [status],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (status === "dragging") setStatus(file ? "selected" : "idle");
    },
    [status, file],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (status === "uploading" || status === "preview") return;
      const dropped = e.dataTransfer.files[0];
      if (dropped) selectFile(dropped);
      else setStatus(file ? "selected" : "idle");
    },
    [status, file, selectFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) selectFile(selected);
      e.target.value = "";
    },
    [selectFile],
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setCustomers(INITIAL_PREVIEW_DATA);
  }, []);

  const handleUpload = useCallback(() => {
    if (!file) return;
    setStatus("uploading");
    setTimeout(() => {
      setStatus("preview");
      toast.success("CSVファイルを読み込みました");
    }, 800);
  }, [file]);

  if (status === "preview" && file) {
    return (
      <CustomerPreviewScreen
        file={file}
        customers={customers}
        onCustomersChange={setCustomers}
        onBack={handleRemove}
        {...props}
      />
    );
  }

  const isDropZoneActive = status === "idle" || status === "dragging";
  const showUploadButton = status === "selected";

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
      />

      {isDropZoneActive && (
        <div>
          <Card
            className={cn(
              "cursor-pointer border-2 border-dashed transition-colors",
              status === "dragging"
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  CSVファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-muted-foreground">
                  またはクリックして選択
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV形式のファイルのみ対応
              </p>
            </CardContent>
          </Card>
          <div className="mt-2 flex justify-end">
            <a
              href="#"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              サンプルcsv
            </a>
          </div>
        </div>
      )}

      {(status === "selected" || status === "uploading") && file && (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
                {status === "uploading" && " · アップロード中..."}
              </p>
            </div>
            {status !== "uploading" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                aria-label="ファイルを削除"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {showUploadButton && (
        <div className="flex justify-center">
          <ActionButton type="button" onClick={handleUpload}>
            アップロード
          </ActionButton>
        </div>
      )}
    </div>
  );
}

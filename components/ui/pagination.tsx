"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="ページネーション"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = React.ComponentProps<"button"> & {
  isActive?: boolean;
};

const PaginationLink = ({
  className,
  isActive,
  ...props
}: PaginationLinkProps) => (
  <Button
    type="button"
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "outline" : "ghost"}
    size="icon"
    className={cn(
      "size-9",
      isActive && "pointer-events-none border-primary",
      className
    )}
    {...props}
  />
);

const PaginationPrevious = ({
  className,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { text?: string }) => (
  <Button
    type="button"
    aria-label="前のページへ"
    variant="outline"
    size="icon"
    className={cn("size-9", className)}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    <ChevronLeft className="size-4" />
    <span className="sr-only">{props.text ?? "前へ"}</span>
  </Button>
);

const PaginationNext = ({
  className,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { text?: string }) => (
  <Button
    type="button"
    aria-label="次のページへ"
    variant="outline"
    size="icon"
    className={cn("size-9", className)}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    <ChevronRight className="size-4" />
    <span className="sr-only">{props.text ?? "次へ"}</span>
  </Button>
);

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex size-9 items-center justify-center", className)}
    {...props}
  >
    …
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
};

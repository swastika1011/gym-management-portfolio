"use client";

import type { ReactElement } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDeleteDialogProps {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void | Promise<void>;
  trigger?: ReactElement;
  className?: string;
}

export function ConfirmDeleteDialog({
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  trigger,
  className,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          trigger ?? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-2xl [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[14px] font-semibold"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          )
        }
      />
      <AlertDialogContent
        className={cn(
          "rounded-[18px] border border-[#FFAA83] bg-white p-4 text-[#3F0000] shadow-sm",
          className
        )}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#B91C1C]/10 text-[#B91C1C]">
            <Trash2 className="size-5" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[18px] font-semibold text-[#3F0000]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="[font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] leading-6 text-[#737373]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-[#FFAA83] bg-[#FFEADE]/50">
          <AlertDialogCancel className="rounded-xl border-[#FFAA83] bg-white [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-2xl bg-[#B91C1C] [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[14px] font-semibold text-white hover:bg-[#991B1B]"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeForm } from "./employee-form";
import type { Employee } from "@/lib/types";

interface EmployeeSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  tenantId: string;
  onSuccess?: () => void;
}

export function EmployeeSidePanel({
  open,
  onOpenChange,
  employee,
  tenantId,
  onSuccess,
}: EmployeeSidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {employee ? "Edit Karyawan" : "Tambah Karyawan Baru"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-6 py-4">
            <EmployeeForm
              employee={employee}
              tenantId={tenantId}
              onSuccess={() => {
                onOpenChange(false);
                onSuccess?.();
              }}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

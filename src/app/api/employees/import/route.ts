import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/validations/employee";

interface ImportRow {
  name: string;
  employee_id?: string;
  jabatan: string;
  divisi: string;
  status_kontrak: string;
  tgl_mulai: string;
  tgl_berakhir?: string;
  no_bpjs_kes?: string;
  no_bpjs_tk?: string;
  npwp?: string;
  gaji_pokok?: string | number;
  email?: string;
  phone?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { tenant_id, rows } = body as {
    tenant_id: string;
    rows: ImportRow[];
  };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "No rows to import" },
      { status: 400 }
    );
  }

  const results: { row: number; status: "ok" | "error"; error?: string }[] = [];
  const validRows: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = employeeSchema.safeParse({
      ...row,
      gaji_pokok: Number(row.gaji_pokok) || 0,
      tgl_berakhir: row.tgl_berakhir || null,
      email: row.email || null,
      phone: row.phone || null,
      employee_id: row.employee_id || null,
    });

    if (!result.success) {
      results.push({
        row: i + 1,
        status: "error",
        error: result.error.issues.map((i) => i.message).join(", "),
      });
    } else {
      validRows.push({ ...result.data, tenant_id });
      results.push({ row: i + 1, status: "ok" });
    }
  }

  if (validRows.length > 0) {
    const { error } = await supabase.from("employees").insert(validRows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    total: rows.length,
    success: validRows.length,
    failed: rows.length - validRows.length,
    results,
  });
}

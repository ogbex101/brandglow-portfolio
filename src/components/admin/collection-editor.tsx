import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "list";
  placeholder?: string;
  defaultValue?: any;
}

interface CollectionEditorProps {
  table: string;
  title: string;
  fields: FieldConfig[];
  titleField: string;
  subtitleField?: string;
}

function emptyForm(fields: FieldConfig[]) {
  const f: Record<string, any> = {};
  fields.forEach((field) => {
    if (field.defaultValue !== undefined) f[field.key] = field.defaultValue;
    else if (field.type === "boolean") f[field.key] = true;
    else if (field.type === "number") f[field.key] = 0;
    else if (field.type === "list") f[field.key] = "";
    else f[field.key] = "";
  });
  return f;
}

/** Generic table-driven CRUD editor: list + add/edit dialog + delete + visible
 *  toggle + up/down sort_order — reused across every simple content table
 *  (services, skills, metrics, credentials, packages, brands, testimonials,
 *  process_steps, faqs, niches) so each one doesn't need a bespoke panel. */
export function CollectionEditor({
  table,
  title,
  fields,
  titleField,
  subtitleField,
}: CollectionEditorProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm(fields));
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasVisible = true; // every content table in this app has a visible column

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [table]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm(fields));
    setOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    const f: Record<string, any> = {};
    fields.forEach((field) => {
      const v = row[field.key];
      f[field.key] =
        field.type === "list"
          ? Array.isArray(v)
            ? v.join("\n")
            : ""
          : (v ?? emptyForm(fields)[field.key]);
    });
    setForm(f);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const payload: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.type === "list") {
        payload[field.key] = form[field.key]
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (field.type === "number") {
        payload[field.key] = Number(form[field.key]) || 0;
      } else {
        payload[field.key] = form[field.key];
      }
    });
    if (!("visible" in payload) && hasVisible) payload.visible = editing ? editing.visible : true;

    let error;
    if (editing) {
      ({ error } = await supabase
        .from(table as any)
        .update(payload)
        .eq("id", editing.id));
    } else {
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1);
      ({ error } = await supabase
        .from(table as any)
        .insert({ ...payload, sort_order: maxSort + 1 }));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Updated." : "Added.");
    setOpen(false);
    await load();
  }

  async function remove(row: any) {
    if (!confirm(`Delete "${row[titleField]}"?`)) return;
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await load();
  }

  async function toggleVisible(row: any) {
    await supabase
      .from(table as any)
      .update({ visible: !row.visible })
      .eq("id", row.id);
    await load();
  }

  async function move(row: any, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === row.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= rows.length) return;
    const other = rows[swapIdx];
    await Promise.all([
      supabase
        .from(table as any)
        .update({ sort_order: other.sort_order })
        .eq("id", row.id),
      supabase
        .from(table as any)
        .update({ sort_order: row.sort_order })
        .eq("id", other.id),
    ]);
    await load();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {!loading && rows.length === 0 && (
          <p className="text-muted-foreground">Nothing here yet.</p>
        )}
        {rows.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-center gap-2 rounded-lg border p-3 ${row.visible ? "" : "opacity-50"}`}
          >
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={i === 0}
                onClick={() => move(row, -1)}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={i === rows.length - 1}
                onClick={() => move(row, 1)}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{row[titleField]}</div>
              {subtitleField && row[subtitleField] && (
                <div className="truncate text-sm text-muted-foreground">{row[subtitleField]}</div>
              )}
            </div>
            <Switch checked={row.visible} onCheckedChange={() => toggleVisible(row)} />
            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => remove(row)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields.map((field) => (
              <label key={field.key} className="block text-sm">
                {field.label}
                {field.type === "boolean" ? (
                  <div className="mt-1">
                    <Switch
                      checked={!!form[field.key]}
                      onCheckedChange={(v) => setForm({ ...form, [field.key]: v })}
                    />
                  </div>
                ) : field.type === "textarea" || field.type === "list" ? (
                  <Textarea
                    rows={field.type === "list" ? 5 : 3}
                    placeholder={field.type === "list" ? "One item per line" : field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

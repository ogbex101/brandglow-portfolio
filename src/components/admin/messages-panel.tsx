import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function MessagesPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);

  async function load() {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data as Msg[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleRead(m: Msg) {
    await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    await load();
  }
  async function deleteMsg(id: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    await load();
  }

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Messages</CardTitle>
        {unread > 0 && <Badge>{unread} unread</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-4 ${m.is_read ? "opacity-70" : "border-primary/40 bg-primary/5"}`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {m.name} <span className="text-sm text-muted-foreground">&lt;{m.email}&gt;</span>
                </div>
                {m.subject && <div className="text-sm font-medium">{m.subject}</div>}
                <div className="text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => toggleRead(m)}>
                  {m.is_read ? "Mark unread" : "Mark read"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMsg(m.id)}>
                  Delete
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm">{m.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

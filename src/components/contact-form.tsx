import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/portfolio.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ContactForm() {
  const submit = useServerFn(submitContact);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submit({ data: form });
      toast.success("Message sent — I'll be in touch soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input required placeholder="Your name" value={form.name} maxLength={100}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required type="email" placeholder="Email address" value={form.email} maxLength={200}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <Input placeholder="Subject (optional)" value={form.subject} maxLength={200}
        onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <Textarea required placeholder="Tell me a bit about your project…" rows={6} value={form.message} maxLength={2000}
        onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <Button type="submit" disabled={loading} size="lg" className="w-full md:w-auto">
        {loading ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}

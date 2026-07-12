import { useEffect, useState } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Loader2, Eye, Heart, Mail } from "lucide-react";

const DAYS = 14;
const chartConfig: ChartConfig = { views: { label: "Views", color: "var(--primary)" } };

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function dayLabel(key: string) {
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [series, setSeries] = useState<{ date: string; views: number }[]>([]);
  const [topLiked, setTopLiked] = useState<{ id: string; title: string; likes_count: number }[]>(
    [],
  );
  const [totalLikes, setTotalLikes] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (DAYS - 1));
      since.setHours(0, 0, 0, 0);

      const [{ count }, { data: recent }, { data: projects }, { count: unreadCount }] =
        await Promise.all([
          supabase.from("page_views").select("id", { count: "exact", head: true }),
          supabase.from("page_views").select("created_at").gte("created_at", since.toISOString()),
          supabase
            .from("projects")
            .select("id, title, likes_count")
            .order("likes_count", { ascending: false })
            .limit(5),
          supabase
            .from("contact_messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
        ]);

      setTotalViews(count ?? 0);
      setUnread(unreadCount ?? 0);

      const byDay: Record<string, number> = {};
      for (let i = 0; i < DAYS; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        byDay[dateKey(d)] = 0;
      }
      (recent ?? []).forEach((r: any) => {
        const k = dateKey(new Date(r.created_at));
        if (k in byDay) byDay[k]++;
      });
      setSeries(Object.entries(byDay).map(([date, views]) => ({ date, views })));

      const liked = (projects as any[]) ?? [];
      setTopLiked(liked);
      setTotalLikes(liked.reduce((sum, p) => sum + (p.likes_count ?? 0), 0));

      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total page views" value={totalViews.toLocaleString()} icon={Eye} />
        <StatTile label="Likes on samples" value={totalLikes.toLocaleString()} icon={Heart} />
        <StatTile label="Unread messages" value={unread} icon={Mail} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Views — last {DAYS} days</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={series} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={dayLabel}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(v) => dayLabel(String(v))} />}
              />
              <Area
                dataKey="views"
                type="monotone"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#viewsFill)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most-liked samples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topLiked.length === 0 && <p className="text-muted-foreground">No likes yet.</p>}
          {topLiked.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              <span>
                <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                {p.title}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-3.5 w-3.5" /> {p.likes_count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

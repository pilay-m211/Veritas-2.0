import { useState } from "react";
import { useListExams, useListGrades, getListGradesQueryKey } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2, TrendingUp, TrendingDown, Medal } from "lucide-react";

function ScoreRange(scores: number[]) {
  const ranges = [
    { label: "90-100", min: 90, max: 100, count: 0 },
    { label: "80-89", min: 80, max: 89, count: 0 },
    { label: "75-79", min: 75, max: 79, count: 0 },
    { label: "60-74", min: 60, max: 74, count: 0 },
    { label: "Below 60", min: 0, max: 59, count: 0 },
  ];
  for (const s of scores) {
    const r = ranges.find(r => s >= r.min && s <= r.max);
    if (r) r.count++;
  }
  return ranges;
}

export default function Reports() {
  const { data: exams, isLoading: examsLoading } = useListExams();
  const [examId, setExamId] = useState<string>("");

  const { data: grades, isLoading: gradesLoading } = useListGrades(
    { examId: examId ? Number(examId) : undefined },
    { query: { enabled: !!examId, queryKey: getListGradesQueryKey({ examId: examId ? Number(examId) : undefined }) } }
  );

  const scores = grades?.map(g => g.score) ?? [];
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const highest = scores.length ? Math.max(...scores) : null;
  const lowest = scores.length ? Math.min(...scores) : null;
  const passing = scores.filter(s => s >= 75).length;
  const rangeData = ScoreRange(scores);

  const topStudents = [...(grades ?? [])].sort((a, b) => b.score - a.score).slice(0, 5);
  const bottomStudents = [...(grades ?? [])].sort((a, b) => a.score - b.score).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">Grade analytics and performance overview</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger data-testid="select-exam-report" className="w-72">
            <SelectValue placeholder="Select an exam to analyze..." />
          </SelectTrigger>
          <SelectContent>
            {exams?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {examId && grades && <span className="text-xs text-muted-foreground font-mono">{grades.length} records</span>}
      </div>

      {!examId ? (
        <div className="rounded-lg border border-border bg-card py-20 text-center">
          <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Select an exam to view its report</p>
        </div>
      ) : gradesLoading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Average", value: avg ? `${avg}%` : "—", icon: BarChart2, color: "text-primary" },
              { label: "Highest", value: highest != null ? `${highest}%` : "—", icon: TrendingUp, color: "text-green-400" },
              { label: "Lowest", value: lowest != null ? `${lowest}%` : "—", icon: TrendingDown, color: "text-red-400" },
              { label: "Passing", value: scores.length ? `${passing}/${scores.length}` : "—", icon: Medal, color: "text-yellow-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} data-testid={`stat-${label.toLowerCase()}`} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-sm tracking-wide mb-4">Score Distribution</h2>
            {scores.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rangeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(222 45% 8%)", border: "1px solid hsl(220 40% 13%)", borderRadius: 6 }} />
                  <Bar dataKey="count" fill="hsl(180 100% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No grades recorded for this exam</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card">
              <div className="px-5 py-3 border-b border-border text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400" /> Top Performers</div>
              {topStudents.length ? topStudents.map((g, i) => (
                <div key={g.id} data-testid={`top-student-${i}`} className="px-5 py-3 flex justify-between items-center border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{g.studentName}</p>
                    <p className="text-xs font-mono text-muted-foreground">{g.studentSchoolId}</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-green-400">{g.score}</span>
                </div>
              )) : <p className="px-5 py-6 text-muted-foreground text-sm">No data</p>}
            </div>
            <div className="rounded-lg border border-border bg-card">
              <div className="px-5 py-3 border-b border-border text-sm font-semibold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-400" /> Needs Attention</div>
              {bottomStudents.length ? bottomStudents.map((g, i) => (
                <div key={g.id} data-testid={`bottom-student-${i}`} className="px-5 py-3 flex justify-between items-center border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{g.studentName}</p>
                    <p className="text-xs font-mono text-muted-foreground">{g.studentSchoolId}</p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${g.score < 75 ? "text-red-400" : "text-muted-foreground"}`}>{g.score}</span>
                </div>
              )) : <p className="px-5 py-6 text-muted-foreground text-sm">No data</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

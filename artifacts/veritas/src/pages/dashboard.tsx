import { useGetDashboardStats } from "@workspace/api-client-react";
import { Users, BookOpen, GraduationCap, BarChart2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`} className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-md flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">System overview — all subsystems nominal</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Students" value={stats?.totalStudents ?? 0} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard label="Exams" value={stats?.totalExams ?? 0} icon={GraduationCap} color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Classes" value={stats?.totalClasses ?? 0} icon={BookOpen} color="bg-indigo-500/10 text-indigo-400" />
          <StatCard label="Avg Score" value={stats?.averageScore != null ? `${stats.averageScore.toFixed(1)}%` : "—"} icon={TrendingUp} color="bg-green-500/10 text-green-400" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <div className="rounded-lg border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-wide">Recent Exams</h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="px-5 py-3"><Skeleton className="h-5 w-full" /></div>)
            ) : stats?.recentExams?.length ? (
              stats.recentExams.map((exam) => (
                <div key={exam.id} data-testid={`exam-row-${exam.id}`} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.className ?? "No class"} · {exam.gradedCount} graded</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-primary">{exam.averageScore != null ? `${exam.averageScore.toFixed(1)}%` : "—"}</p>
                    <p className="text-xs text-muted-foreground">avg</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No exams yet</div>
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="rounded-lg border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-wide">Recent Grades</h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="px-5 py-3"><Skeleton className="h-5 w-full" /></div>)
            ) : stats?.recentGrades?.length ? (
              stats.recentGrades.map((grade) => (
                <div key={grade.id} data-testid={`grade-row-${grade.id}`} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{grade.studentName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{grade.studentSchoolId} · {grade.examTitle}</p>
                  </div>
                  <div className={`text-sm font-bold font-mono ${grade.score >= 75 ? "text-primary" : "text-destructive-foreground"}`}>
                    {grade.score}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No grades yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

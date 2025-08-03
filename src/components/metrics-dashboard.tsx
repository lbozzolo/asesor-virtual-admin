import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, MessageSquare, Percent } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
};

function MetricCard({ title, value, icon: Icon, change }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">{change}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Conversaciones Totales"
        value="1,234"
        icon={MessageSquare}
        change="+20.1% del último mes"
      />
      <MetricCard
        title="Ventas"
        value="$54,231.89"
        icon={DollarSign}
        change="+12.5% del último mes"
      />
      <MetricCard
        title="Tasa de Conversión"
        value="4.5%"
        icon={Percent}
        change="+1.2% del último mes"
      />
    </div>
  );
}

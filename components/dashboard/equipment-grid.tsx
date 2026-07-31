import { equipmentList } from "@/lib/equipment-data";
import { EquipmentCard } from "@/components/dashboard/equipment-card";

export function EquipmentGrid() {
  const availableCount = equipmentList.filter(
    (e) => e.status === "available"
  ).length;
  const inUseCount = equipmentList.filter((e) => e.status === "in_use").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="전체 기기" value={equipmentList.length} />
        <StatCard
          label="사용 가능"
          value={availableCount}
          accent="text-success"
        />
        <StatCard
          label="사용 중"
          value={inUseCount}
          accent="text-destructive"
        />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">분석기기 목록</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {equipmentList.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${accent ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

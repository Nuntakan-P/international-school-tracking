import { chanceClass } from "@/lib/format";

export function ChanceCell({ chance }: { chance: number }) {
  return (
    <span className="chance">
      <span className={`cdot ${chanceClass(chance)}`} />
      {chance}%
    </span>
  );
}

import type { ReactNode } from "react";

export function Tag({ variant, children }: { variant: string; children: ReactNode }) {
  return <span className={`tag ${variant}`}>{children}</span>;
}

export function GradeTag({ grade }: { grade: string }) {
  return <Tag variant={`g${grade}`}>{grade}</Tag>;
}

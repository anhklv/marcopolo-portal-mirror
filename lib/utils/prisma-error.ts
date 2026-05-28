type PrismaErrorLike = {
  code: string;
  meta?: { target?: string | string[] };
};

export function isPrismaErrorLike(err: unknown): err is PrismaErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as PrismaErrorLike).code === "string"
  );
}

export function isPrismaUniqueError(err: unknown): boolean {
  return isPrismaErrorLike(err) && err.code === "P2002";
}

export function isPrismaUniqueViolationOnField(
  err: unknown,
  field: string
): boolean {
  if (!isPrismaErrorLike(err) || err.code !== "P2002") return false;

  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return target.includes(field);
  }
  if (typeof target === "string") {
    return target.includes(field);
  }
  return false;
}

export function formatPrismaErrorDetails(error: PrismaErrorLike): string {
  const parts = [`code=${error.code}`];
  if (error.meta?.target !== undefined) {
    parts.push(`target=${JSON.stringify(error.meta.target)}`);
  }
  return parts.join(", ");
}

type PrismaErrorLike = {
  code: string;
  meta?: {
    target?: string | string[];
    driverAdapterError?: {
      cause?: {
        constraint?: {
          fields?: string[];
        };
      };
    };
  };
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

function getUniqueViolationFields(err: PrismaErrorLike): string[] {
  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === "string");
  }
  if (typeof target === "string") {
    return [target];
  }

  const fields = err.meta?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(fields)) {
    return fields.filter((field): field is string => typeof field === "string");
  }

  return [];
}

export function isPrismaUniqueViolationOnField(
  err: unknown,
  field: string
): boolean {
  if (!isPrismaErrorLike(err) || err.code !== "P2002") return false;
  return getUniqueViolationFields(err).includes(field);
}

export function formatPrismaErrorDetails(error: PrismaErrorLike): string {
  const parts = [`code=${error.code}`];
  const fields = getUniqueViolationFields(error);
  if (fields.length > 0) {
    parts.push(`fields=${JSON.stringify(fields)}`);
  } else if (error.meta?.target !== undefined) {
    parts.push(`target=${JSON.stringify(error.meta.target)}`);
  }
  return parts.join(", ");
}

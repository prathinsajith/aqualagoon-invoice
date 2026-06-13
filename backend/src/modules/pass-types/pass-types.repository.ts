import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { passTypeInclude } from "./pass-types.types.js";
import type { ListPassTypesQuery, PassTypeWithCount } from "./pass-types.types.js";

type Kind = "GUEST" | "STUDENT" | "VIP" | "FAMILY" | "CORPORATE";
type DurationType = "HOUR" | "DAY" | "MONTH" | "YEAR";
type EntryType = "LIMITED" | "UNLIMITED";
type DiscountType = "NONE" | "FIXED" | "PERCENTAGE";
type Status = "ACTIVE" | "INACTIVE";

export interface PersistPassTypeInput {
  type: Kind;
  name: string;
  description?: string | null;
  durationType: DurationType;
  durationValue: number;
  entryType: EntryType;
  allowedEntries?: number | null;
  maxEntriesPerDay?: number | null;
  price: number;
  discountType: DiscountType;
  discountValue: number;
  status: Status;
  createdBy: string | null;
}

export interface UpdatePassTypeData {
  type?: Kind;
  name?: string;
  description?: string | null;
  durationType?: DurationType;
  durationValue?: number;
  entryType?: EntryType;
  allowedEntries?: number | null;
  maxEntriesPerDay?: number | null;
  price?: number;
  discountType?: DiscountType;
  discountValue?: number;
  status?: Status;
  updatedBy: string | null;
}

export class PassTypesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListPassTypesQuery): Promise<{ rows: PassTypeWithCount[]; total: number }> {
    const where: Prisma.PassTypeWhereInput = { deletedAt: null };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.passType.findMany({
        where,
        include: passTypeInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.passType.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<PassTypeWithCount | null> {
    return this.db.passType.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: passTypeInclude,
    });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.passType.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistPassTypeInput): Promise<PassTypeWithCount> {
    return this.db.passType.create({
      data: {
        type: input.type,
        name: input.name,
        description: input.description ?? null,
        durationType: input.durationType,
        durationValue: input.durationValue,
        entryType: input.entryType,
        allowedEntries: input.allowedEntries ?? null,
        maxEntriesPerDay: input.maxEntriesPerDay ?? null,
        price: new Prisma.Decimal(input.price),
        discountType: input.discountType,
        discountValue: new Prisma.Decimal(input.discountValue),
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: passTypeInclude,
    });
  }

  update(id: string, data: UpdatePassTypeData): Promise<PassTypeWithCount> {
    const { price, discountValue, ...rest } = data;
    return this.db.passType.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
        ...(discountValue !== undefined ? { discountValue: new Prisma.Decimal(discountValue) } : {}),
      },
      include: passTypeInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.passType.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
    });
  }
}

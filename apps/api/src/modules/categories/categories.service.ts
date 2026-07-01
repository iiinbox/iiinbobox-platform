import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { CategoryCreateInput } from "@iiiiibox/shared-types";

@Injectable()
export class CategoriesService {
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async create(input: CategoryCreateInput) {
    const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ConflictException("Category slug already in use");
    }
    let parentId: string | undefined;
    if (input.parentSlug) {
      const parent = await prisma.category.findUnique({ where: { slug: input.parentSlug } });
      if (!parent) {
        throw new NotFoundException("Parent category not found");
      }
      parentId = parent.id;
    }
    return prisma.category.create({ data: { name: input.name, slug: input.slug, parentId } });
  }
}

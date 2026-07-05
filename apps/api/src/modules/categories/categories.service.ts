import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { CategoryCreateInput } from "@iiiiibox/shared-types";

@Injectable()
export class CategoriesService {
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async listWithChildren() {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: {
            children: { orderBy: { name: "asc" } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Recursively remove children first
    const children = await prisma.category.findMany({ where: { parentId: id } });
    for (const child of children) {
      await this.remove(child.id);
    }
    return prisma.category.delete({ where: { id } });
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
    return prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        parentId,
      },
    });
  }

  async updateImage(id: string, imageUrl: string) {
    return prisma.category.update({ where: { id }, data: { imageUrl } });
  }
}

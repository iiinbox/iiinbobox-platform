import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { CategoryCreateInput } from "@iiiiibox/shared-types";
import { RedisService } from "../redis/redis.service";

// Item 3: the public flat list is what the storefront hits on every
// category-nav render — cache it. listWithChildren() (the admin tree view)
// stays uncached, same "editor context needs fresh data" reasoning as
// page-config's draft reads.
const LIST_TTL_SECONDS = 5 * 60;
const LIST_KEY = "categories:list";

@Injectable()
export class CategoriesService {
  constructor(private readonly redis: RedisService) {}

  async list() {
    const cached = await this.redis.get(LIST_KEY);
    if (cached !== null) return cached;
    const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
    await this.redis.set(LIST_KEY, rows, LIST_TTL_SECONDS);
    return rows;
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
    const result = await prisma.category.delete({ where: { id } });
    await this.redis.del(LIST_KEY);
    return result;
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
    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        parentId,
      },
    });
    await this.redis.del(LIST_KEY);
    return category;
  }

  async updateImage(id: string, imageUrl: string) {
    const category = await prisma.category.update({ where: { id }, data: { imageUrl } });
    await this.redis.del(LIST_KEY);
    return category;
  }
}

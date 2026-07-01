import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, VendorStatus } from "@iiiiibox/database";
import type { ProductCreateInput, ProductModerateInput, ProductUpdateInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";
import { StorageService } from "../storage/storage.service";
import { SearchService } from "../search/search.service";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

@Injectable()
export class ProductsService {
  constructor(
    private readonly storage: StorageService,
    private readonly searchSvc: SearchService,
  ) {}

  private async syncToSearch(productId: string) {
    if (!this.searchSvc.isEnabled) {
      return;
    }
    const p = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, vendor: true },
    });
    if (!p) {
      return;
    }
    await this.searchSvc.upsertProduct({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      priceMinor: p.priceMinor,
      currency: p.currency,
      categorySlug: p.category.slug,
      vendorSlug: p.vendor.storeSlug,
      vendorName: p.vendor.storeName,
      isActive: p.isActive,
      isApproved: p.isApproved,
      vendorApproved: p.vendor.status === VendorStatus.APPROVED,
    });
  }

  private async resolveCategoryId(categorySlug: string) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category.id;
  }

  private slugify(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private async findOwned(user: RequestUser, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.vendorId !== user.vendorId) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async create(user: RequestUser, input: ProductCreateInput) {
    if (!user.vendorId) {
      throw new ForbiddenException("Not a vendor");
    }
    const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: user.vendorId } });
    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException("Vendor must be approved to list products");
    }
    const categoryId = await this.resolveCategoryId(input.categorySlug);
    const slug = await this.uniqueSlug(this.slugify(input.title));
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId,
        title: input.title,
        slug,
        description: input.description,
        priceMinor: input.priceMinor,
        currency: input.currency,
        stockQty: input.stockQty,
      },
    });
    void this.syncToSearch(product.id);
    return product;
  }

  async update(user: RequestUser, productId: string, input: ProductUpdateInput) {
    await this.findOwned(user, productId);
    const { categorySlug, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (categorySlug) {
      data.categoryId = await this.resolveCategoryId(categorySlug);
    }
    const updated = await prisma.product.update({ where: { id: productId }, data });
    void this.syncToSearch(productId);
    return updated;
  }

  async addImage(user: RequestUser, productId: string, file: Express.Multer.File) {
    await this.findOwned(user, productId);
    const url = await this.storage.upload(file.buffer, file.mimetype, `products/${productId}`);
    return prisma.product.update({
      where: { id: productId },
      data: { images: { push: url } },
    });
  }

  async listMine(user: RequestUser) {
    if (!user.vendorId) {
      throw new ForbiddenException("Not a vendor");
    }
    return prisma.product.findMany({
      where: { vendorId: user.vendorId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { vendor: { select: { storeName: true, storeSlug: true, status: true } } },
    });
    if (
      !product ||
      !product.isActive ||
      !product.isApproved ||
      product.vendor.status !== VendorStatus.APPROVED
    ) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async search(params: {
    search?: string;
    categorySlug?: string;
    vendorSlug?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, params.pageSize ?? PAGE_SIZE_DEFAULT));

    if (params.search && this.searchSvc.isEnabled) {
      const { productIds, total } = await this.searchSvc.search({
        query: params.search,
        categorySlug: params.categorySlug,
        vendorSlug: params.vendorSlug,
        page,
        pageSize,
      });
      const items = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { vendor: { select: { storeName: true, storeSlug: true } } },
      });
      const ordered = productIds
        .map((id) => items.find((p) => p.id === id))
        .filter(Boolean) as typeof items;
      return { items: ordered, total, page, pageSize };
    }

    const where = {
      isActive: true,
      isApproved: true,
      vendor: {
        status: VendorStatus.APPROVED,
        ...(params.vendorSlug ? { storeSlug: params.vendorSlug } : {}),
      },
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { vendor: { select: { storeName: true, storeSlug: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async listForAdmin(page?: number, pageSize?: number) {
    const p = Math.max(1, page ?? 1);
    const ps = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize ?? PAGE_SIZE_DEFAULT));
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        include: { vendor: { select: { storeName: true, storeSlug: true } } },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.product.count(),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  async moderate(productId: string, input: ProductModerateInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    const moderated = await prisma.product.update({ where: { id: productId }, data: input });
    void this.syncToSearch(productId);
    return moderated;
  }
}

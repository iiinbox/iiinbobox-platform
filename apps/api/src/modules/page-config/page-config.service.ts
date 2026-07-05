import { Injectable } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";

@Injectable()
export class PageConfigService {
  async get(page: string) {
    const row = await prisma.pageConfig.findUnique({ where: { page } });
    return row?.config ?? { components: [] };
  }

  async save(page: string, config: unknown) {
    return prisma.pageConfig.upsert({
      where: { page },
      update: { config: config as any },
      create: { page, config: config as any },
    });
  }
}

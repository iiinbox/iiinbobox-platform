import { Injectable, Logger } from "@nestjs/common";
import { MeiliSearch } from "meilisearch";

export interface SearchableProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  categorySlug: string;
  vendorSlug: string;
  vendorName: string;
  isActive: boolean;
  isApproved: boolean;
  vendorApproved: boolean;
}

const INDEX_NAME = "products";

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: MeiliSearch | null;

  constructor() {
    if (process.env.MEILISEARCH_URL) {
      this.client = new MeiliSearch({
        host: process.env.MEILISEARCH_URL,
        apiKey: process.env.MEILISEARCH_MASTER_KEY ?? undefined,
      });
      this.ensureIndex();
    } else {
      this.client = null;
      this.logger.log("MEILISEARCH_URL not set — using Postgres full-text search fallback");
    }
  }

  get isEnabled() {
    return this.client !== null;
  }

  private async ensureIndex() {
    const index = this.client!.index(INDEX_NAME);
    await index.updateFilterableAttributes(["categorySlug", "vendorSlug", "isActive", "isApproved", "vendorApproved"]);
    await index.updateSearchableAttributes(["title", "description", "vendorName"]);
    await index.updateSortableAttributes(["priceMinor"]);
  }

  async upsertProduct(product: SearchableProduct) {
    if (!this.client) {
      return;
    }
    try {
      await this.client.index(INDEX_NAME).addDocuments([product]);
    } catch (err) {
      this.logger.error(`Meilisearch upsert failed for ${product.id}: ${(err as Error).message}`);
    }
  }

  async removeProduct(productId: string) {
    if (!this.client) {
      return;
    }
    try {
      await this.client.index(INDEX_NAME).deleteDocument(productId);
    } catch (err) {
      this.logger.error(`Meilisearch delete failed for ${productId}: ${(err as Error).message}`);
    }
  }

  async search(params: { query: string; categorySlug?: string; vendorSlug?: string; page: number; pageSize: number }) {
    if (!this.client) {
      throw new Error("Meilisearch is not enabled");
    }

    const filters: string[] = [
      "isActive = true",
      "isApproved = true",
      "vendorApproved = true",
    ];
    if (params.categorySlug) {
      filters.push(`categorySlug = "${params.categorySlug}"`);
    }
    if (params.vendorSlug) {
      filters.push(`vendorSlug = "${params.vendorSlug}"`);
    }

    const result = await this.client.index(INDEX_NAME).search(params.query, {
      filter: filters.join(" AND "),
      offset: (params.page - 1) * params.pageSize,
      limit: params.pageSize,
    });

    return {
      productIds: result.hits.map((h) => (h as SearchableProduct).id),
      total: result.estimatedTotalHits ?? 0,
    };
  }
}

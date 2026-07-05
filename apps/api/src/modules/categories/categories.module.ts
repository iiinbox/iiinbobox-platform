import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { CategoriesController } from "./categories.controller";
import { AdminCategoriesController } from "./admin-categories.controller";
import { CategoriesService } from "./categories.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule, MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } })],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

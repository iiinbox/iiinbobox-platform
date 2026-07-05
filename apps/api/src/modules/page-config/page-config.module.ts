import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { PageConfigController } from "./page-config.controller";
import { PageConfigService } from "./page-config.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule, MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } })],
  controllers: [PageConfigController],
  providers: [PageConfigService],
})
export class PageConfigModule {}

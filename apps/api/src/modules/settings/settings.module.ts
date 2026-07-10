import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule, MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } })],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}

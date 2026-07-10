import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

// @Global so every feature module (auth, page-config, categories, storage)
// can inject RedisService without each one re-importing RedisModule.
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

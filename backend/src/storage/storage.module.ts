import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CompressionService } from './compression.service';

// @Global() expose StorageService et CompressionService dans tous les modules
// sans import explicite — justifié car le stockage est une infrastructure transversale.
@Global()
@Module({
  providers: [StorageService, CompressionService],
  exports: [StorageService, CompressionService],
})
export class StorageModule {}
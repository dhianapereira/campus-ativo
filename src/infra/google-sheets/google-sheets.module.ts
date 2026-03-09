import { Module } from '@nestjs/common'
import { GoogleSheetsFetcher } from '@/domain/maintenance-problems/application/services/google-sheets-fetcher'
import { GoogleSheetsFetcherService } from './google-sheets-fetcher.service'

@Module({
  providers: [
    {
      provide: GoogleSheetsFetcher,
      useClass: GoogleSheetsFetcherService,
    },
  ],
  exports: [GoogleSheetsFetcher],
})
export class GoogleSheetsModule {}

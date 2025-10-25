import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountController } from './account/account.controller';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { AccountService } from './account/account.service';
import { AccountModule } from './account/account.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [AccountModule, ProductModule],
  controllers: [AppController, AccountController, ProductController],
  providers: [AppService, ProductService, AccountService],
})
export class AppModule {}

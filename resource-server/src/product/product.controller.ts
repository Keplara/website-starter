import { Controller, Get, Param } from '@nestjs/common';

@Controller('product')
export class ProductController {
    constructor() {

    }

    @Get()
    async GetProduct(@Param('name') name: string): Promise<any> {
        
        return null;
    }

}

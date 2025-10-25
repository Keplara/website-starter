import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Account } from './interfaces/account.interface';

@Controller('account')
export class AccountController {
    constructor() {

    }

    @Post('create')
    async createAccount(@Body() account: Account): Promise<Account> {
        return account;
    }

    @Post('sign-in')
    async signIn(@Body() account: Account): Promise<Boolean> {
        return false;
    }

    @Post('sign-off')
    async signOff(@Body() account: Account): Promise<Boolean> {
        return false;
    }

    @Delete('delete-account')
    async deleteAccount(@Param('id') accountId: string): Promise<any> {
        return accountId;
    }

    @Post()
    async forgotPassword(): Promise<any> {
        return null;
    }
}

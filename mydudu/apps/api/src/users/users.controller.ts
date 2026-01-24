import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('districts')
  searchDistricts(@Query('q') query: string) {
    return this.usersService.searchDistricts(query || '');
  }

  @Get('villages')
  searchVillages(@Query('q') query: string) {
    return this.usersService.searchVillages(query || '');
  }

  @Get('details')
  findByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post('puskesmas')
  createPuskesmas(@Body() body: { fullName: string; email: string; district: string; profilePicture?: string }) {
    return this.usersService.createPuskesmas(body);
  }

  @Patch(':id')
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() body: { fullName?: string; profilePicture?: string }) {
    return this.usersService.updateProfile(id, body);
  }

  @Patch(':id/approve')
  approveUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  rejectUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.rejectUser(id);
  }
}

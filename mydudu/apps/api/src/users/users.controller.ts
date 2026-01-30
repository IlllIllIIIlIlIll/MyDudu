import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('districts')
  searchDistricts(@Query('q') query: string) {
    return this.usersService.searchDistricts(query || '');
  }

  @Get('villages')
  searchVillages(@Query('q') query: string) {
    return this.usersService.searchVillages(query || '');
  }

  @Get('posyandus')
  searchPosyandus(@Query('q') query: string) {
    return this.usersService.searchPosyandus(query || '');
  }

  @Get('details')
  findByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post('puskesmas')
  @UseGuards(AuthGuard)
  async createPuskesmas(@Body() body: { fullName: string; email: string; district: string; profilePicture?: string }, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.createPuskesmas(body, actor?.id);
  }

  @Post('parent')
  @UseGuards(AuthGuard)
  async createParent(@Body() body: { fullName: string; phoneNumber: string; villageId: number; }, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.createParent(body, actor?.id);
  }

  @Post('posyandu')
  @UseGuards(AuthGuard)
  async createPosyandu(@Body() body: { fullName: string; email: string; village: string; profilePicture?: string }, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.createPosyandu(body, actor?.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateProfile(@Param('id', ParseIntPipe) id: number, @Body() body: { fullName?: string; profilePicture?: string; district?: string; email?: string }, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.updateProfile(id, body, actor?.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.deleteUser(id, actor?.id);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard)
  async approveUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.approveUser(id, actor?.id);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard)
  async rejectUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const actorEmail = req.user?.email;
    const actor = actorEmail ? await this.usersService.findByEmail(actorEmail) : null;
    return this.usersService.rejectUser(id, actor?.id);
  }
}

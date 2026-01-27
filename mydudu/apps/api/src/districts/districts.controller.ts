import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) { }

  @Get()
  findAll() {
    return this.districtsService.findAll();
  }

  @Post('posyandu')
  createPosyandu(@Body() body: { name: string, villageId: number }) {
    return this.districtsService.createPosyandu(body.name, body.villageId);
  }
}

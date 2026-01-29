import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
    @Get('download')
    downloadReport(@Query('period') period: string, @Query('userId') userId: string, @Res() res: Response) {
        // Mock CSV generation
        const filename = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        const csvContent =
            `Tanggal,Posyandu,Jumlah Anak,Rata-rata BB,Rata-rata TB
2026-02-01,Posyandu Melati,15,12.5,85.0
2026-02-02,Posyandu Mawar,20,11.8,82.1
`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csvContent);
    }
}

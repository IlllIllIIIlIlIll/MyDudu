import { DiagnosisCode } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RenewLockDto {
  @IsString()
  @MaxLength(64)
  lockToken: string;
}

export class DiagnoseSessionDto {
  @IsEnum(DiagnosisCode)
  diagnosisCode: DiagnosisCode;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  diagnosisText?: string;

  @IsInt()
  @Min(1)
  version: number;

  @IsString()
  @MaxLength(64)
  lockToken: string;
}

export class CancelSessionDto {
  @IsInt()
  @Min(1)
  version: number;

  @IsString()
  @MaxLength(64)
  lockToken: string;
}


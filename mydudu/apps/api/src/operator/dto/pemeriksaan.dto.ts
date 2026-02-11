import { DiagnosisCode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ArrayMinSize, IsArray, IsBoolean, ValidateNested } from 'class-validator';

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizStepDto)
  quizSteps: QuizStepDto[];
}

export class QuizStepDto {
  @IsInt()
  @Min(1)
  stepOrder: number;

  @IsString()
  @MaxLength(64)
  nodeId: string;

  @IsString()
  question: string;

  @IsBoolean()
  answerYes: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nextNodeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  treeVersion?: string;
}

export class CancelSessionDto {
  @IsInt()
  @Min(1)
  version: number;

  @IsString()
  @MaxLength(64)
  lockToken: string;
}

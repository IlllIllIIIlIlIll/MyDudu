
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ExamOutcome } from './clinical.types';

export class StartSessionDto {
    @IsInt()
    @IsNotEmpty()
    childId: number;

    @IsInt()
    @IsNotEmpty()
    deviceId: number;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    diseaseIds: string[];
}

export class AnswerDto {
    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsNotEmpty()
    nodeId: string;

    @IsBoolean()
    @IsNotEmpty()
    answer: boolean;
}

export class ClinicalNodeDto {
    nodeId: string;
    question: string;
    nodeType: string;
    // We don't expose next/yes/no logic to frontend to keep it "dumb"
}

export class SessionStatusDto {
    sessionId: string;
    status: string; // IN_PROGRESS, COMPLETED, etc.

    @IsOptional()
    currentNode?: ClinicalNodeDto | null;

    @IsOptional()
    outcome?: ExamOutcome | null;

    @IsOptional()
    diseaseOutcomes?: Record<string, ExamOutcome>; // Per-disease breakdown
}

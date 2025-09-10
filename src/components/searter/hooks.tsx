/**
 * 排座状态管理模块
 * 负责管理上传文件、学生数据、排座结果等状态
 */
import { useCallback, useState } from 'react';
import type {
    ArrangementResult,
    ClassroomConfig,
    Student,
    SubjectAnalysis,
} from './types';
import {
    arrangeSeatsByMultiSubjects,
    parseXlsxFile,
    validateFileFormat,
} from './utils';

export const useSeatArrangementState = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>(
        [],
    );
    const [classroomConfig, setClassroomConfig] = useState<ClassroomConfig>({
        groups: 6,
        rows: 5,
        seatsPerGroup: 2,
    });
    const [arrangementResult, setArrangementResult] =
        useState<ArrangementResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(
        null,
    );

    // 处理文件上传
    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!validateFileFormat(file)) {
                throw new Error('请上传有效的 Excel 文件（.xlsx 或 .xls）');
            }

            const result = await parseXlsxFile(file);
            setStudents(result.students);
            setSubjects(result.subjects);
            setSubjectAnalysis(result.analysis);
            setUploadedFileName(file.name);
            setArrangementResult(null); // 清空之前的排座结果
        } catch (err) {
            setError(err instanceof Error ? err.message : '文件处理失败');
            setStudents([]);
            setSubjects([]);
            setSubjectAnalysis([]);
            setUploadedFileName(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 执行排座
    const performArrangement = useCallback(() => {
        if (students.length === 0) {
            setError('请先上传学生数据');
            return;
        }

        if (subjects.length < 2) {
            setError('至少需要2个科目的成绩数据');
            return;
        }

        // 检查教室容量
        const totalSeats =
            classroomConfig.groups *
            classroomConfig.rows *
            classroomConfig.seatsPerGroup;
        if (students.length > totalSeats) {
            setError(
                `教室容量不足！当前设置可容纳${totalSeats}人，但有${students.length}名学生`,
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = arrangeSeatsByMultiSubjects(
                students,
                subjects,
                subjectAnalysis,
                classroomConfig,
            );
            setArrangementResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : '排座失败');
        } finally {
            setIsLoading(false);
        }
    }, [students, subjects, subjectAnalysis, classroomConfig]);

    // 重置所有数据
    const resetData = useCallback(() => {
        setStudents([]);
        setSubjects([]);
        setSubjectAnalysis([]);
        setArrangementResult(null);
        setError(null);
        setUploadedFileName(null);
    }, []);

    return {
        students,
        subjects,
        subjectAnalysis,
        arrangementResult,
        isLoading,
        error,
        uploadedFileName,
        classroomConfig,
        handleFileUpload,
        performArrangement,
        resetData,
        setClassroomConfig,
    };
};

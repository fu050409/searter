/**
 * 排座状态管理模块
 * 负责管理上传文件、学生数据、排座结果等状态
 */
import { useCallback, useState } from 'react';
import type { ArrangementResult, Student } from './types';
import {
    arrangeSeatsByScore,
    parseXlsxFile,
    validateFileFormat,
} from './utils';

export const useSeatArrangementState = () => {
    const [students, setStudents] = useState<Student[]>([]);
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

            const parsedStudents = await parseXlsxFile(file);
            setStudents(parsedStudents);
            setUploadedFileName(file.name);
            setArrangementResult(null); // 清空之前的排座结果
        } catch (err) {
            setError(err instanceof Error ? err.message : '文件处理失败');
            setStudents([]);
            setUploadedFileName(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 执行排座
    const performArrangement = useCallback(
        (seatsPerTable: number = 4) => {
            if (students.length === 0) {
                setError('请先上传学生数据');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = arrangeSeatsByScore(students, seatsPerTable);
                setArrangementResult(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : '排座失败');
            } finally {
                setIsLoading(false);
            }
        },
        [students],
    );

    // 重置所有数据
    const resetData = useCallback(() => {
        setStudents([]);
        setArrangementResult(null);
        setError(null);
        setUploadedFileName(null);
    }, []);

    return {
        students,
        arrangementResult,
        isLoading,
        error,
        uploadedFileName,
        handleFileUpload,
        performArrangement,
        resetData,
    };
};

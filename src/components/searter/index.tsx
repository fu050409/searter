/**
 * 排座组件主界面
 * 负责整体 UI 渲染和用户交互
 */

import {
    Award,
    BarChart3,
    Download,
    RefreshCw,
    Settings,
    TrendingUp,
    Upload,
    Users,
} from 'lucide-react';
import type React from 'react';
import { useRef } from 'react';
import { ExcelFormatGuide } from '../guide';
import { useSeatArrangementState } from './hooks';
import SeatLayoutGrid from './layout';
import type { ArrangementResult } from './types';

export function SeatArrangement() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
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
    } = useSeatArrangementState();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
        // 重置文件输入框的值，确保可以重新上传同一个文件
        event.target.value = '';
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const downloadResult = () => {
        if (!arrangementResult) return;

        const content = generateResultText(arrangementResult);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '排座结果.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateResultText = (result: ArrangementResult) => {
        let content = '智能排座结果（多科成绩优势互补）\n';
        content += '==========================================\n\n';
        content += `教室配置: ${result.classroomConfig.rows}排 × ${result.classroomConfig.groups}组，每组${result.classroomConfig.seatsPerGroup}人\n`;
        content += `总学生数: ${result.totalStudents}\n`;
        content += `平均成绩: ${result.averageScore.toFixed(2)}\n`;
        content += `配对质量方差: ${result.scoreVariance.toFixed(2)}\n\n`;
        content += `科目: ${subjects.join(', ')}\n\n`;

        result.tables.forEach((table, index) => {
            const groupRow =
                Math.floor(index / result.classroomConfig.groups) + 1;
            const groupCol = (index % result.classroomConfig.groups) + 1;
            content += `第${groupRow}排第${groupCol}组 (总分: ${table.totalScore.toFixed(2)}, 平均分: ${table.averageScore.toFixed(2)}):\n`;
            table.seats.forEach((seat, seatIndex) => {
                if (seat.student) {
                    const scoresText = subjects
                        .map(
                            (subject) =>
                                `${subject}: ${seat.student?.scores[subject] || 'N/A'}`,
                        )
                        .join(', ');
                    content += `  座位${seatIndex + 1}: ${seat.student.name} (${scoresText}) [${seat.student.level}]\n`;
                }
            });
            content += '\n';
        });

        return content;
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'excellent':
                return 'text-purple-600 bg-purple-100';
            case 'good':
                return 'text-blue-600 bg-blue-100';
            case 'average':
                return 'text-green-600 bg-green-100';
            case 'poor':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getLevelText = (level: string) => {
        switch (level) {
            case 'excellent':
                return '优秀';
            case 'good':
                return '良好';
            case 'average':
                return '一般';
            case 'poor':
                return '待提高';
            default:
                return '未知';
        }
    };

    // 计算教室总容量
    const totalCapacity =
        classroomConfig.groups *
        classroomConfig.rows *
        classroomConfig.seatsPerGroup;
    const capacityExceeded = students.length > totalCapacity;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Excel格式说明 */}
            <ExcelFormatGuide />

            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Upload className="mr-2 text-blue-600" size={24} />
                    多科成绩数据上传
                </h2>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={triggerFileUpload}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors"
                    >
                        <Upload
                            className="mx-auto mb-4 text-gray-400"
                            size={48}
                        />
                        <p className="text-gray-600 mb-2">
                            点击上传 Excel 文件 (.xlsx, .xls)
                        </p>
                        <p className="text-sm text-gray-500">
                            文件格式：第一列为姓名，后续列为各科成绩（如数学、英语、语文等）
                        </p>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {uploadedFileName && (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                            <span className="text-green-700">
                                已上传: {uploadedFileName}
                            </span>
                            <button
                                type="button"
                                onClick={resetData}
                                className="text-red-600 hover:text-red-800 transition-colors"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 教室配置区域 */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Settings className="mr-2 text-indigo-600" size={24} />
                    教室布局配置
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">
                            组数（列数）
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={classroomConfig.groups}
                            onChange={(e) =>
                                setClassroomConfig({
                                    ...classroomConfig,
                                    groups: parseInt(e.target.value, 10) || 1,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">
                            排数（行数）
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={classroomConfig.rows}
                            onChange={(e) =>
                                setClassroomConfig({
                                    ...classroomConfig,
                                    rows: parseInt(e.target.value, 10) || 1,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">
                            每组人数
                        </span>
                        <select
                            value={classroomConfig.seatsPerGroup}
                            onChange={(e) =>
                                setClassroomConfig({
                                    ...classroomConfig,
                                    seatsPerGroup: parseInt(e.target.value, 10),
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={2}>2人（同桌）</option>
                            <option value={4}>4人（四人桌）</option>
                            <option value={6}>6人（六人桌）</option>
                        </select>
                    </div>
                </div>

                {/* 教室容量预览 */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                            教室总容量：
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                            {totalCapacity} 个座位
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        配置：{classroomConfig.rows} 排 ×{' '}
                        {classroomConfig.groups} 组 ×{' '}
                        {classroomConfig.seatsPerGroup} 人
                    </div>

                    {students.length > 0 && (
                        <div
                            className={`mt-2 text-sm ${capacityExceeded ? 'text-red-600' : 'text-green-600'}`}
                        >
                            {capacityExceeded
                                ? `⚠️ 容量不足！需要 ${students.length} 个座位，但只有 ${totalCapacity} 个`
                                : `✅ 容量充足，可容纳 ${students.length} 名学生`}
                        </div>
                    )}
                </div>
            </div>

            {/* 科目分析 */}
            {subjects.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <TrendingUp
                            className="mr-2 text-indigo-600"
                            size={24}
                        />
                        科目成绩分析
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectAnalysis.map((analysis) => (
                            <div
                                key={analysis.subject}
                                className="bg-gray-50 rounded-lg p-4"
                            >
                                <h3 className="font-semibold text-lg mb-2">
                                    {analysis.subject}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>平均分:</span>
                                        <span className="font-medium">
                                            {analysis.average.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>优秀线:</span>
                                        <span className="font-medium text-purple-600">
                                            {analysis.excellent.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>及格线:</span>
                                        <span className="font-medium text-orange-600">
                                            {analysis.poor.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 学生数据预览 */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Users className="mr-2 text-green-600" size={24} />
                        学生数据预览 ({students.length} 人)
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="border border-gray-200 rounded-lg p-4"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">
                                        {student.name}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(student.level)}`}
                                    >
                                        {getLevelText(student.level)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject}
                                            className="flex justify-between"
                                        >
                                            <span className="text-gray-600">
                                                {subject}:
                                            </span>
                                            <span className="font-medium">
                                                {student.scores[
                                                    subject
                                                ]?.toFixed(1) || 'N/A'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        平均分:
                                    </span>
                                    <span className="font-semibold text-blue-600">
                                        {student.averageScore.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={performArrangement}
                            disabled={
                                isLoading ||
                                capacityExceeded ||
                                students.length === 0
                            }
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw
                                        className="mr-2 animate-spin"
                                        size={16}
                                    />
                                    智能排座中...
                                </>
                            ) : (
                                <>
                                    <Award className="mr-2" size={16} />
                                    开始优势互补排座
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* 排座结果 */}
            {arrangementResult && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            <BarChart3
                                className="mr-2 text-purple-600"
                                size={24}
                            />
                            优势互补排座结果
                        </h2>
                        <button
                            type="button"
                            onClick={downloadResult}
                            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="mr-2" size={16} />
                            下载结果
                        </button>
                    </div>

                    {/* 统计信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {arrangementResult.totalStudents}
                            </div>
                            <div className="text-blue-800">总学生数</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {arrangementResult.averageScore.toFixed(2)}
                            </div>
                            <div className="text-green-800">平均成绩</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {arrangementResult.scoreVariance.toFixed(2)}
                            </div>
                            <div className="text-purple-800">配对质量方差</div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4 text-center">
                            <div className="text-lg font-bold text-indigo-600">
                                {arrangementResult.classroomConfig.rows}×
                                {arrangementResult.classroomConfig.groups}
                            </div>
                            <div className="text-indigo-800">教室布局</div>
                        </div>
                    </div>

                    {/* 座位布局可视化 */}
                    <div className="mb-8">
                        <SeatLayoutGrid
                            result={arrangementResult}
                            subjects={subjects}
                        />
                    </div>

                    {/* 各组详情 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {arrangementResult.tables.map((table, index) => {
                            const groupRow =
                                Math.floor(
                                    index /
                                        arrangementResult.classroomConfig
                                            .groups,
                                ) + 1;
                            const groupCol =
                                (index %
                                    arrangementResult.classroomConfig.groups) +
                                1;

                            return (
                                <div
                                    key={table.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-lg">
                                            第{groupRow}排第{groupCol}组
                                        </h3>
                                        <div className="text-sm text-gray-600">
                                            平均:{' '}
                                            {table.averageScore.toFixed(1)}分
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {table.seats.map(
                                            (seat, seatIndex) =>
                                                seat.student && (
                                                    <div
                                                        key={`${seatIndex}-${seat.student?.id}`}
                                                        className="bg-gray-50 rounded-lg p-3"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-medium">
                                                                {
                                                                    seat.student
                                                                        .name
                                                                }
                                                            </span>
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(seat.student.level)}`}
                                                            >
                                                                {getLevelText(
                                                                    seat.student
                                                                        .level,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            {subjects.map(
                                                                (subject) => (
                                                                    <div
                                                                        key={
                                                                            subject
                                                                        }
                                                                        className="flex justify-between"
                                                                    >
                                                                        <span className="text-gray-600">
                                                                            {
                                                                                subject
                                                                            }
                                                                            :
                                                                        </span>
                                                                        <span className="font-medium">
                                                                            {seat.student?.scores[
                                                                                subject
                                                                            ]?.toFixed(
                                                                                1,
                                                                            ) ||
                                                                                'N/A'}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                        )}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="text-sm font-medium text-gray-700">
                                            总分: {table.totalScore.toFixed(1)}
                                            分
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

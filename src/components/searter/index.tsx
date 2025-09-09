/**
 * 排座组件主界面
 * 负责整体 UI 渲染和用户交互
 */

import { BarChart3, Download, RefreshCw, Upload, Users } from 'lucide-react';
import type React from 'react';
import { useRef } from 'react';
import { useSeatArrangementState } from './hooks';
import type { ArrangementResult } from './types';

const SeatArrangement: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        students,
        arrangementResult,
        isLoading,
        error,
        uploadedFileName,
        handleFileUpload,
        performArrangement,
        resetData,
    } = useSeatArrangementState();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
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
        let content = '智能排座结果\n';
        content += '==========================================\n\n';
        content += `总学生数: ${result.totalStudents}\n`;
        content += `平均成绩: ${result.averageScore.toFixed(2)}\n`;
        content += `成绩方差: ${result.scoreVariance.toFixed(2)}\n\n`;

        result.tables.forEach((table, index) => {
            content += `第${index + 1}桌 (总分: ${table.totalScore.toFixed(2)}, 平均分: ${table.averageScore.toFixed(2)}):\n`;
            table.seats.forEach((seat, seatIndex) => {
                if (seat.student) {
                    content += `  座位${seatIndex + 1}: ${seat.student.name} (${seat.student.score}分)\n`;
                }
            });
            content += '\n';
        });

        return content;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Upload className="mr-2 text-blue-600" size={24} />
                    数据上传
                </h2>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={triggerFileUpload}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors"
                    >
                        <Upload
                            className="mx-auto mb-4 text-gray-400"
                            size={48}
                        />
                        <p className="text-gray-600 mb-2">
                            点击上传 Excel 文件 (.xlsx, .xls)
                        </p>
                        <p className="text-sm text-gray-500">
                            文件格式：第一列为姓名，第二列为成绩
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

            {/* 学生数据预览 */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Users className="mr-2 text-green-600" size={24} />
                        学生数据预览 ({students.length} 人)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                            >
                                <span className="font-medium">
                                    {student.name}
                                </span>
                                <span className="text-blue-600 font-semibold">
                                    {student.score}分
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={() => performArrangement(4)}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw
                                        className="mr-2 animate-spin"
                                        size={16}
                                    />
                                    排座中...
                                </>
                            ) : (
                                '开始排座'
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
                            排座结果
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                            <div className="text-purple-800">成绩方差</div>
                        </div>
                    </div>

                    {/* 各桌详情 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {arrangementResult.tables.map((table, index) => (
                            <div
                                key={table.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-lg">
                                        第{index + 1}桌
                                    </h3>
                                    <div className="text-sm text-gray-600">
                                        平均: {table.averageScore.toFixed(1)}分
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {table.seats.map(
                                        (seat, seatIndex) =>
                                            seat.student && (
                                                <div
                                                    key={`${seatIndex}-${seat.row}-${seat.col}`}
                                                    className="flex justify-between items-center bg-gray-50 rounded p-2"
                                                >
                                                    <span className="font-medium">
                                                        {seat.student.name}
                                                    </span>
                                                    <span className="text-blue-600 font-semibold">
                                                        {seat.student.score}分
                                                    </span>
                                                </div>
                                            ),
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="text-sm font-medium text-gray-700">
                                        总分: {table.totalScore.toFixed(1)}分
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatArrangement;

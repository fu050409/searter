/**
 * Excel格式说明组件
 * 为用户提供详细的Excel文件格式示例和说明
 */

import { ChevronDown, ChevronUp, Download, FileText, Info } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

const ExcelFormatGuide: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 示例数据
    const exampleData = [
        ['姓名', '数学', '英语', '语文', '物理', '化学'],
        ['张三', 85, 92, 78, 88, 75],
        ['李四', 76, 68, 89, 72, 83],
        ['王五', 92, 85, 94, 91, 88],
        ['赵六', 68, 79, 72, 65, 71],
        ['陈七', 89, 94, 86, 87, 92],
        ['刘八', 74, 71, 83, 76, 79],
        ['孙九', 95, 89, 91, 94, 90],
        ['周十', 72, 66, 75, 69, 74],
    ];

    const downloadExampleFile = () => {
        // 创建CSV格式的示例文件
        const csvContent = exampleData.map((row) => row.join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], {
            type: 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '排座位学生成绩模板.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <button
                type="button"
                className="w-full flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <FileText className="mr-2 text-blue-600" size={20} />
                    <h3 className="font-semibold text-blue-800">
                        Excel文件格式说明
                    </h3>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            downloadExampleFile();
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Download className="mr-1" size={14} />
                        下载模板
                    </button>
                    {isExpanded ? (
                        <ChevronUp className="text-blue-600" size={20} />
                    ) : (
                        <ChevronDown className="text-blue-600" size={20} />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="mt-4 space-y-4">
                    {/* 格式要求 */}
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center mb-3">
                            <Info className="mr-2 text-blue-600" size={16} />
                            <h4 className="font-semibold text-gray-800">
                                格式要求
                            </h4>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>
                                    <strong>第一行</strong>
                                    ：必须是标题行，包含"姓名"和各科目名称
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>
                                    <strong>第一列</strong>：学生姓名（必填）
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>
                                    <strong>其他列</strong>
                                    ：各科成绩（数字格式，至少需要2个科目）
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>
                                    <strong>文件格式</strong>：支持 .xlsx 和
                                    .xls 格式
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>
                                    <strong>科目数量</strong>
                                    ：至少2个科目，推荐3-6个科目效果最佳
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* 示例表格 */}
                    <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">
                            标准格式示例
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        {exampleData[0].map((header, index) => (
                                            <th
                                                key={`${index}-${header}`}
                                                className="px-3 py-2 text-left font-semibold text-gray-700 border"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {exampleData
                                        .slice(1)
                                        .map((row, rowIndex) => (
                                            <tr
                                                key={`${rowIndex}-${row}`}
                                                className="hover:bg-gray-50"
                                            >
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={`${rowIndex}-${cellIndex}-${cell}`}
                                                        className="px-3 py-2 border"
                                                    >
                                                        {cellIndex === 0 ? (
                                                            <span className="font-medium text-gray-800">
                                                                {cell}
                                                            </span>
                                                        ) : (
                                                            <span className="text-blue-600 font-medium">
                                                                {cell}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 注意事项 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">
                            ⚠️ 注意事项
                        </h4>
                        <ul className="space-y-1 text-sm text-yellow-700">
                            <li>
                                •
                                确保所有成绩都是数字格式，不要包含文字或特殊符号
                            </li>
                            <li>• 如果某学生某科成绩缺失，可以留空或填写0</li>
                            <li>• 学生姓名不能重复，系统会根据姓名进行识别</li>
                            <li>
                                • 建议成绩范围在0-100之间，便于系统进行水平分析
                            </li>
                            <li>
                                •
                                科目名称建议简洁明了，如"数学"、"英语"、"语文"等
                            </li>
                        </ul>
                    </div>

                    {/* 算法说明 */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">
                            🎯 排座原理
                        </h4>
                        <ul className="space-y-1 text-sm text-green-700">
                            <li>
                                • <strong>优势互补</strong>
                                ：数学好的配数学弱的，英语好的配英语弱的
                            </li>
                            <li>
                                • <strong>水平均衡</strong>
                                ：避免学霸和学困生直接配对，确保整体水平相近
                            </li>
                            <li>
                                • <strong>智能分析</strong>
                                ：自动分析各科成绩分布，定义优秀、良好、一般、待提高四个等级
                            </li>
                            <li>
                                • <strong>配对优化</strong>
                                ：通过算法计算最佳配对组合，最大化学习互助效果
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcelFormatGuide;

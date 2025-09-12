/**
 * 座位布局网格可视化组件
 * 以网格形式显示教室座位安排
 */
import type { ArrangementResult, Student } from './types';

interface SeatLayoutGridProps extends React.ComponentPropsWithRef<'div'> {
    result: ArrangementResult;
    subjects: string[];
}

interface GridItems {
    student: Student;
    tableId: number;
    groupRow: number;
    groupCol: number;
    seatIndex: number;
}

export function SeatLayoutGrid({
    result,
    subjects,
    ...props
}: SeatLayoutGridProps) {
    const { classroomConfig, tables } = result;

    // 创建座位网格数据结构
    const createSeatGrid = () => {
        const grid: (GridItems | null)[][] = [];

        // 初始化网格
        for (let row = 0; row < classroomConfig.rows; row++) {
            grid[row] = [];
            for (
                let col = 0;
                col < classroomConfig.groups * classroomConfig.seatsPerGroup;
                col++
            ) {
                grid[row][col] = null;
            }
        }

        // 填充学生数据
        tables.forEach((table, tableIndex) => {
            const groupRow = Math.floor(tableIndex / classroomConfig.groups);
            const groupCol = tableIndex % classroomConfig.groups;

            table.seats.forEach((seat, seatIndex) => {
                if (seat.student) {
                    const col =
                        groupCol * classroomConfig.seatsPerGroup + seatIndex;
                    if (
                        groupRow < classroomConfig.rows &&
                        col <
                            classroomConfig.groups *
                                classroomConfig.seatsPerGroup
                    ) {
                        grid[groupRow][col] = {
                            student: seat.student,
                            tableId: table.id,
                            groupRow: groupRow + 1,
                            groupCol: groupCol + 1,
                            seatIndex: seatIndex + 1,
                        };
                    }
                }
            });
        });

        return grid;
    };

    const seatGrid = createSeatGrid();

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'excellent':
                return 'bg-purple-100 border-purple-300 text-purple-800';
            case 'good':
                return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'average':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'poor':
                return 'bg-orange-100 border-orange-300 text-orange-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const getGroupBorderClass = (row: number, col: number) => {
        // const groupCol = Math.floor(col / classroomConfig.seatsPerGroup);
        const seatInGroup = col % classroomConfig.seatsPerGroup;

        let classes = 'border ';

        // 组边界加粗
        if (seatInGroup === 0) {
            classes += 'border-l-2 border-l-gray-400 ';
        }
        if (seatInGroup === classroomConfig.seatsPerGroup - 1) {
            classes += 'border-r-2 border-r-gray-400 ';
        }
        if (row === 0) {
            classes += 'border-t-2 border-t-gray-400 ';
        }
        if (row === classroomConfig.rows - 1) {
            classes += 'border-b-2 border-b-gray-400 ';
        }

        return classes;
    };

    return (
        <div className="w-full" {...props}>
            <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    教室座位布局图
                </h3>
                <div className="text-sm text-gray-600">
                    {classroomConfig.rows} 排 × {classroomConfig.groups}{' '}
                    组，每组 {classroomConfig.seatsPerGroup} 人
                </div>
            </div>

            {/* 讲台标识 */}
            <div className="mb-4 text-center">
                <div className="inline-block bg-gray-700 text-white px-8 py-2 rounded-md text-sm font-medium">
                    讲 台
                </div>
            </div>

            {/* 座位网格 */}
            <div className="overflow-x-auto">
                <div
                    className="grid gap-1 mx-auto"
                    style={{
                        gridTemplateColumns: `repeat(${
                            classroomConfig.groups *
                            classroomConfig.seatsPerGroup
                        }, minmax(120px, 1fr))`,
                        gridTemplateRows: `repeat(${classroomConfig.rows}, 1fr)`,
                    }}
                >
                    {seatGrid.map((row, rowIndex) =>
                        row.map((seat, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}-${seat?.student.id}`}
                                className={`
                  relative min-h-[80px] p-2 text-xs
                  ${
                      seat
                          ? getLevelColor(seat.student.level)
                          : 'bg-gray-50 border-gray-200 border-dashed'
                  }
                  ${getGroupBorderClass(rowIndex, colIndex)}
                  transition-all duration-200 hover:shadow-md
                `}
                            >
                                {seat ? (
                                    <div className="h-full flex flex-col justify-between">
                                        {/* 学生信息 */}
                                        <div className="flex-1">
                                            <div
                                                className="font-medium text-sm mb-1 truncate"
                                                title={seat.student.name}
                                            >
                                                {seat.student.name}
                                            </div>

                                            {/* 科目成绩 */}
                                            <div className="space-y-0.5">
                                                {subjects
                                                    .slice(0, 2)
                                                    .map((subject) => (
                                                        <div
                                                            key={subject}
                                                            className="flex justify-between text-xs"
                                                        >
                                                            <span className="truncate">
                                                                {subject}:
                                                            </span>
                                                            <span className="font-medium ml-1">
                                                                {seat.student.scores[
                                                                    subject
                                                                ]?.toFixed(0) ||
                                                                    'N/A'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                {subjects.length > 2 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{subjects.length - 2}科
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 座位信息 */}
                                        <div className="text-xs text-gray-600 mt-1">
                                            {seat.groupRow}排{seat.groupCol}组
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        空座位
                                    </div>
                                )}
                            </div>
                        )),
                    )}
                </div>
            </div>

            {/* 图例 */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    学生水平图例
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
                        <span className="text-sm text-gray-700">优秀</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                        <span className="text-sm text-gray-700">良好</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                        <span className="text-sm text-gray-700">一般</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                        <span className="text-sm text-gray-700">待提高</span>
                    </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                    • 粗边框表示不同的学习小组分界 •
                    每个座位显示学生姓名和前两科成绩
                </div>
            </div>
        </div>
    );
}

export default SeatLayoutGrid;

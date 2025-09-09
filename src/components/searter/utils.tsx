/**
 * 排座算法工具模块
 * 实现成绩互补的座位分配算法
 */

/**
 * 文件解析工具模块
 * 负责解析 xlsx 文件并提取学生数据
 */
import * as XLSX from 'xlsx';
import type { ArrangementResult, Seat, Student, Table } from './types';

export const parseXlsxFile = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // 将工作表转换为 JSON 格式
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                });

                // 解析数据，假设第一行是标题，第一列是姓名，第二列是成绩
                const students: Student[] = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[];
                    if (row.length >= 2 && row[0] && row[1] !== undefined) {
                        const name = String(row[0]).trim();
                        const score = parseFloat(String(row[1]));

                        if (name && !Number.isNaN(score)) {
                            students.push({
                                id: `student_${i}`,
                                name,
                                score,
                                originalIndex: i,
                            });
                        }
                    }
                }

                if (students.length === 0) {
                    reject(new Error('未找到有效的学生数据，请检查文件格式'));
                    return;
                }

                resolve(students);
            } catch (error: unknown) {
                reject(
                    new Error(
                        '文件解析失败，请确保文件格式正确' +
                            (error as Error).message,
                    ),
                );
            }
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsBinaryString(file);
    });
};

export const validateFileFormat = (file: File): boolean => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];

    return (
        allowedTypes.includes(file.type) ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
    );
};

/**
 * 按成绩互补原则分配座位
 * 使用贪心算法尽量平衡各桌成绩
 */
export const arrangeSeatsByScore = (
    students: Student[],
    seatsPerTable: number = 4,
    rows: number = 6,
    cols: number = 8,
): ArrangementResult => {
    // 按成绩排序
    const sortedStudents = [...students].sort((a, b) => b.score - a.score);

    // 计算需要的桌子数量
    const totalSeats = rows * cols;
    const tableCount = Math.ceil(totalSeats / seatsPerTable);

    // 初始化桌子
    const tables: Table[] = [];
    for (let i = 0; i < tableCount; i++) {
        tables.push({
            id: i,
            seats: [],
            totalScore: 0,
            averageScore: 0,
        });
    }

    // 创建座位
    let seatIndex = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tableId = Math.floor(seatIndex / seatsPerTable);
            if (tableId < tableCount) {
                const seat: Seat = {
                    row,
                    col,
                    tableId,
                };
                tables[tableId].seats.push(seat);
            }
            seatIndex++;
        }
    }

    // 分配学生到座位 - 使用轮换分配确保成绩平衡
    const assignedStudents = new Set<string>();

    // 第一轮：高分学生分配
    let tableIndex = 0;
    for (
        let i = 0;
        i < sortedStudents.length && i < Math.ceil(sortedStudents.length / 2);
        i++
    ) {
        const student = sortedStudents[i];
        if (tables[tableIndex].seats.length > 0) {
            const availableSeat = tables[tableIndex].seats.find(
                (seat) => !seat.student,
            );
            if (availableSeat) {
                availableSeat.student = student;
                assignedStudents.add(student.id);
                tables[tableIndex].totalScore += student.score;
            }
        }
        tableIndex = (tableIndex + 1) % tables.length;
    }

    // 第二轮：低分学生分配（逆向分配以平衡成绩）
    tableIndex = tables.length - 1;
    for (let i = sortedStudents.length - 1; i >= 0; i--) {
        const student = sortedStudents[i];
        if (!assignedStudents.has(student.id)) {
            let assigned = false;
            // 寻找成绩最高且还有空位的桌子
            const tablesWithSeats = tables
                .filter((table) => table.seats.some((seat) => !seat.student))
                .sort((a, b) => b.totalScore - a.totalScore);

            for (const table of tablesWithSeats) {
                const availableSeat = table.seats.find((seat) => !seat.student);
                if (availableSeat) {
                    availableSeat.student = student;
                    table.totalScore += student.score;
                    assigned = true;
                    break;
                }
            }

            if (!assigned && tables[tableIndex]) {
                const availableSeat = tables[tableIndex].seats.find(
                    (seat) => !seat.student,
                );
                if (availableSeat) {
                    availableSeat.student = student;
                    tables[tableIndex].totalScore += student.score;
                }
            }
        }
        tableIndex = tableIndex > 0 ? tableIndex - 1 : tables.length - 1;
    }

    // 计算每桌平均分
    tables.forEach((table) => {
        const studentCount = table.seats.filter((seat) => seat.student).length;
        table.averageScore =
            studentCount > 0 ? table.totalScore / studentCount : 0;
    });

    // 计算整体统计
    const totalStudents = students.length;
    const totalScore = students.reduce(
        (sum, student) => sum + student.score,
        0,
    );
    const averageScore = totalScore / totalStudents;

    // 计算成绩方差
    const tableAverages = tables
        .map((table) => table.averageScore)
        .filter((avg) => avg > 0);
    const scoreVariance = calculateVariance(tableAverages);

    return {
        tables: tables.filter((table) =>
            table.seats.some((seat) => seat.student),
        ),
        totalStudents,
        averageScore,
        scoreVariance,
    };
};

/**
 * 计算方差
 */
const calculateVariance = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map((num) => (num - mean) ** 2);
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
};

/**
 * 优化座位分配（可选的后处理步骤）
 */
export const optimizeArrangement = (
    result: ArrangementResult,
): ArrangementResult => {
    // 可以在这里实现更复杂的优化算法
    // 比如模拟退火、遗传算法等
    return result;
};

/**
 * 学生数据类型定义
 * 包含学生的基本信息和成绩
 */
export interface Student {
    id: string;
    name: string;
    score: number;
    originalIndex: number;
}

/**
 * 座位信息类型定义
 * 包含座位位置和分配的学生
 */
export interface Seat {
    row: number;
    col: number;
    student?: Student;
    tableId: number;
}

/**
 * 桌子信息类型定义
 * 包含桌子ID、座位和总成绩
 */
export interface Table {
    id: number;
    seats: Seat[];
    totalScore: number;
    averageScore: number;
}

/**
 * 排座结果类型定义
 */
export interface ArrangementResult {
    tables: Table[];
    totalStudents: number;
    averageScore: number;
    scoreVariance: number;
}

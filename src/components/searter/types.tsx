/**
 * 学生数据类型定义
 * 包含学生的基本信息和各科成绩
 */
export interface Student {
    id: string;
    name: string;
    scores: {
        [subject: string]: number; // 支持多科成绩，如 { '数学': 85, '英语': 78, '语文': 92 }
    };
    totalScore: number; // 总分
    averageScore: number; // 平均分
    originalIndex: number;
    level: 'excellent' | 'good' | 'average' | 'poor'; // 学生水平等级
}

/**
 * 科目成绩分析
 */
export interface SubjectAnalysis {
    subject: string;
    average: number;
    excellent: number; // 优秀线
    poor: number; // 及格线
}

/**
 * 学生配对信息
 */
export interface StudentPair {
    student1: Student;
    student2: Student;
    compatibilityScore: number; // 互补性得分
    subjectComplements: { [subject: string]: number }; // 各科互补度
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
 * 教室配置类型定义
 */
export interface ClassroomConfig {
    groups: number; // 组数（列数）
    rows: number; // 排数（行数）
    seatsPerGroup: number; // 每组人数（通常为2人）
}

/**
 * 排座结果类型定义
 */
export interface ArrangementResult {
    tables: Table[];
    totalStudents: number;
    averageScore: number;
    scoreVariance: number;
    classroomConfig: ClassroomConfig;
}

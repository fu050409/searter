/**
 * 文件解析工具模块
 * 负责解析 xlsx 文件并提取学生多科成绩数据
 */
import * as XLSX from 'xlsx';
import type {
    ArrangementResult,
    ClassroomConfig,
    Seat,
    Student,
    StudentPair,
    SubjectAnalysis,
    Table,
} from './types';

/**
 * 按各科成绩优势互补原则分配座位
 */
export const arrangeSeatsByMultiSubjects = (
    students: Student[],
    subjects: string[],
    analysis: SubjectAnalysis[],
    classroomConfig: ClassroomConfig,
): ArrangementResult => {
    // 计算所有可能的学生配对及其互补性得分
    const pairs = generateStudentPairs(students, subjects, analysis);

    // 使用匈牙利算法或贪心算法进行最优配对
    const optimalPairs = selectOptimalPairs(pairs);

    // 根据配对结果和教室配置安排座位
    const tables = createTablesFromPairsWithClassroom(
        optimalPairs,
        students,
        classroomConfig,
    );

    // 计算统计信息
    const totalStudents = students.length;
    const totalScore = students.reduce(
        (sum, student) => sum + student.totalScore,
        0,
    );
    const averageScore = totalScore / totalStudents;

    // 计算配对质量方差
    const pairQualities = optimalPairs.map((pair) => pair.compatibilityScore);
    const scoreVariance = calculateVariance(pairQualities);

    return {
        tables,
        totalStudents,
        averageScore,
        scoreVariance,
        classroomConfig,
    };
};

/**
 * 生成所有可能的学生配对
 */
const generateStudentPairs = (
    students: Student[],
    subjects: string[],
    analysis: SubjectAnalysis[],
): StudentPair[] => {
    const pairs: StudentPair[] = [];

    for (let i = 0; i < students.length; i++) {
        for (let j = i + 1; j < students.length; j++) {
            const student1 = students[i];
            const student2 = students[j];

            // 避免极优和极差学生配对
            if (shouldAvoidPairing(student1, student2)) {
                continue;
            }

            const compatibility = calculateCompatibility(
                student1,
                student2,
                subjects,
                analysis,
            );

            pairs.push({
                student1,
                student2,
                compatibilityScore: compatibility.totalScore,
                subjectComplements: compatibility.subjectComplements,
            });
        }
    }

    // 按互补性得分排序
    return pairs.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};

/**
 * 判断是否应该避免两个学生配对
 */
const shouldAvoidPairing = (student1: Student, student2: Student): boolean => {
    // 避免优秀和较差学生直接配对
    if (
        (student1.level === 'excellent' && student2.level === 'poor') ||
        (student1.level === 'poor' && student2.level === 'excellent')
    ) {
        return true;
    }

    // 避免总分差距过大的学生配对
    const scoreDiff = Math.abs(student1.averageScore - student2.averageScore);
    const averageScore = (student1.averageScore + student2.averageScore) / 2;

    // 如果分数差距超过平均分的30%，则避免配对
    return scoreDiff > averageScore * 0.3;
};

/**
 * 计算两个学生的互补性
 */
const calculateCompatibility = (
    student1: Student,
    student2: Student,
    subjects: string[],
    analysis: SubjectAnalysis[],
): {
    totalScore: number;
    subjectComplements: { [subject: string]: number };
} => {
    const subjectComplements: { [subject: string]: number } = {};
    let totalCompatibility = 0;

    subjects.forEach((subject) => {
        const score1 = student1.scores[subject];
        const score2 = student2.scores[subject];

        if (score1 !== undefined && score2 !== undefined) {
            const subjectAnalysis = analysis.find((a) => a.subject === subject);
            if (subjectAnalysis) {
                // 计算该科目的互补度
                const complement = calculateSubjectComplement(
                    score1,
                    score2,
                    subjectAnalysis,
                );
                subjectComplements[subject] = complement;
                totalCompatibility += complement;
            }
        }
    });

    // 考虑整体水平相近性
    const levelCompatibility = calculateLevelCompatibility(student1, student2);
    totalCompatibility += levelCompatibility * 20; // 给水平相近性较高权重

    return {
        totalScore: totalCompatibility,
        subjectComplements,
    };
};

/**
 * 计算单科互补度
 */
const calculateSubjectComplement = (
    score1: number,
    score2: number,
    analysis: SubjectAnalysis,
): number => {
    // 归一化分数到0-1区间
    const maxScore = Math.max(analysis.excellent, 100);
    const minScore = Math.min(analysis.poor, 0);
    const range = maxScore - minScore;

    const normalizedScore1 = (score1 - minScore) / range;
    const normalizedScore2 = (score2 - minScore) / range;

    // 计算互补度：一个高一个低的情况得分更高
    const average = (normalizedScore1 + normalizedScore2) / 2;
    const difference = Math.abs(normalizedScore1 - normalizedScore2);

    // 理想情况：平均水平适中，差异适度（0.2-0.4）
    const averageBonus = 1 - Math.abs(average - 0.5) * 2; // 平均分越接近中位数越好
    const differenceBonus =
        difference < 0.6 ? 1 - Math.abs(difference - 0.3) / 0.3 : 0; // 差异适中最好

    return (averageBonus + differenceBonus) * 50;
};

/**
 * 计算水平匹配度
 */
const calculateLevelCompatibility = (
    student1: Student,
    student2: Student,
): number => {
    const levelScores = {
        excellent: 4,
        good: 3,
        average: 2,
        poor: 1,
    };

    const level1 = levelScores[student1.level];
    const level2 = levelScores[student2.level];
    const levelDiff = Math.abs(level1 - level2);

    // 相邻水平的搭配最佳，水平差距过大的搭配较差
    if (levelDiff === 1) return 10; // 相邻水平最佳
    if (levelDiff === 0) return 7; // 同水平也不错
    if (levelDiff === 2) return 3; // 差距较大
    return 0; // 差距过大
};

/**
 * 选择最优配对组合
 */
const selectOptimalPairs = (pairs: StudentPair[]): StudentPair[] => {
    const selectedPairs: StudentPair[] = [];
    const pairedStudents = new Set<string>();

    // 贪心算法选择最优配对
    for (const pair of pairs) {
        if (
            !pairedStudents.has(pair.student1.id) &&
            !pairedStudents.has(pair.student2.id)
        ) {
            selectedPairs.push(pair);
            pairedStudents.add(pair.student1.id);
            pairedStudents.add(pair.student2.id);
        }
    }

    return selectedPairs;
};

/**
 * 根据配对结果和教室配置创建桌子安排
 */
const createTablesFromPairsWithClassroom = (
    pairs: StudentPair[],
    allStudents: Student[],
    classroomConfig: ClassroomConfig,
): Table[] => {
    const { groups, rows, seatsPerGroup } = classroomConfig;
    const tables: Table[] = [];

    // 初始化教室布局
    let tableId = 0;
    for (let row = 0; row < rows; row++) {
        for (let group = 0; group < groups; group++) {
            const table: Table = {
                id: tableId++,
                seats: [],
                totalScore: 0,
                averageScore: 0,
            };

            // 为每个小组创建座位
            for (let seat = 0; seat < seatsPerGroup; seat++) {
                table.seats.push({
                    row: row,
                    col: group * seatsPerGroup + seat,
                    tableId: table.id,
                });
            }

            tables.push(table);
        }
    }

    // 分配配对学生到桌子
    const assignedStudents = new Set<string>();
    let currentTableIndex = 0;

    // 优先分配配对的学生
    for (const pair of pairs) {
        if (currentTableIndex >= tables.length) break;

        const table = tables[currentTableIndex];
        const availableSeats = table.seats.filter((seat) => !seat.student);

        if (availableSeats.length >= 2) {
            // 分配这一对学生
            availableSeats[0].student = pair.student1;
            availableSeats[1].student = pair.student2;

            table.totalScore +=
                pair.student1.totalScore + pair.student2.totalScore;
            assignedStudents.add(pair.student1.id);
            assignedStudents.add(pair.student2.id);

            // 如果当前桌子满了，移到下一桌
            if (availableSeats.length === 2) {
                currentTableIndex++;
            }
        }
    }

    // 分配剩余的单独学生
    const remainingStudents = allStudents.filter(
        (student) => !assignedStudents.has(student.id),
    );
    let studentIndex = 0;

    for (
        let i = 0;
        i < tables.length && studentIndex < remainingStudents.length;
        i++
    ) {
        const table = tables[i];
        const availableSeats = table.seats.filter((seat) => !seat.student);

        for (const seat of availableSeats) {
            if (studentIndex < remainingStudents.length) {
                const student = remainingStudents[studentIndex++];
                seat.student = student;
                table.totalScore += student.totalScore;
            }
        }
    }

    // 计算每桌平均分
    tables.forEach((table) => {
        const studentCount = table.seats.filter((seat) => seat.student).length;
        table.averageScore =
            studentCount > 0 ? table.totalScore / studentCount : 0;
    });

    return tables.filter((table) => table.seats.some((seat) => seat.student));
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
    // 按总成绩排序
    const sortedStudents = [...students].sort(
        (a, b) => b.totalScore - a.totalScore,
    );

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
                tables[tableIndex].totalScore += student.totalScore;
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
                    table.totalScore += student.totalScore;
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
                    tables[tableIndex].totalScore += student.totalScore;
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
        (sum, student) => sum + student.totalScore,
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
        classroomConfig: {
            groups: Math.ceil(cols / seatsPerTable),
            rows,
            seatsPerGroup: seatsPerTable,
        },
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

export const parseXlsxFile = (
    file: File,
): Promise<{
    students: Student[];
    subjects: string[];
    analysis: SubjectAnalysis[];
}> => {
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

                if (jsonData.length < 2) {
                    reject(
                        new Error('文件数据不足，请确保至少有标题行和数据行'),
                    );
                    return;
                }

                // 解析标题行，获取科目信息
                const headers = jsonData[0] as string[];
                if (headers.length < 3) {
                    reject(new Error('文件格式错误，至少需要姓名和两科成绩'));
                    return;
                }

                const nameColumn = 0;
                const subjects = headers
                    .slice(1)
                    .filter((header) => header?.trim()); // 除姓名外的所有列作为科目

                if (subjects.length === 0) {
                    reject(new Error('未找到有效的科目列'));
                    return;
                }

                // 解析学生数据
                const students: Student[] = [];
                const subjectScores: { [subject: string]: number[] } = {};

                // 初始化科目分数数组
                subjects.forEach((subject) => {
                    subjectScores[subject] = [];
                });

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[];
                    if (row.length >= 2 && row[nameColumn]) {
                        const name = String(row[nameColumn]).trim();
                        const scores: { [subject: string]: number } = {};
                        let totalScore = 0;
                        let validSubjects = 0;

                        // 解析各科成绩
                        for (let j = 0; j < subjects.length; j++) {
                            const scoreValue = row[j + 1];
                            if (
                                scoreValue !== undefined &&
                                scoreValue !== null &&
                                scoreValue !== ''
                            ) {
                                const score = parseFloat(String(scoreValue));
                                if (!Number.isNaN(score)) {
                                    scores[subjects[j]] = score;
                                    totalScore += score;
                                    validSubjects++;
                                    subjectScores[subjects[j]].push(score);
                                }
                            }
                        }

                        if (name && validSubjects >= 2) {
                            // 至少需要2科成绩
                            const averageScore = totalScore / validSubjects;
                            students.push({
                                id: `student_${i}`,
                                name,
                                scores,
                                totalScore,
                                averageScore,
                                originalIndex: i,
                                level: 'average', // 先设置默认值，后续会重新计算
                            });
                        }
                    }
                }

                if (students.length === 0) {
                    reject(new Error('未找到有效的学生数据，请检查文件格式'));
                    return;
                }

                // 分析各科成绩分布，确定学生水平等级
                const analysis = analyzeSubjects(subjectScores, subjects);
                const studentsWithLevels = assignStudentLevels(
                    students,
                    analysis,
                );

                resolve({
                    students: studentsWithLevels,
                    subjects,
                    analysis,
                });
            } catch (_error) {
                reject(new Error('文件解析失败，请确保文件格式正确'));
            }
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsBinaryString(file);
    });
};

/**
 * 分析各科成绩分布
 */
const analyzeSubjects = (
    subjectScores: { [subject: string]: number[] },
    subjects: string[],
): SubjectAnalysis[] => {
    return subjects.map((subject) => {
        const scores = subjectScores[subject];
        if (scores.length === 0) {
            return { subject, average: 0, excellent: 0, poor: 0 };
        }

        const sortedScores = [...scores].sort((a, b) => b - a);
        const average =
            scores.reduce((sum, score) => sum + score, 0) / scores.length;

        // 使用四分位数来定义优秀和较差的标准
        const excellentIndex = Math.floor(scores.length * 0.25); // 前25%为优秀
        const poorIndex = Math.floor(scores.length * 0.75); // 后25%为较差

        return {
            subject,
            average,
            excellent: sortedScores[excellentIndex] || average + 10,
            poor: sortedScores[poorIndex] || average - 10,
        };
    });
};

/**
 * 为学生分配水平等级
 */
const assignStudentLevels = (
    students: Student[],
    analysis: SubjectAnalysis[],
): Student[] => {
    return students.map((student) => {
        const excellentCount = analysis.filter(
            (sub) => student.scores[sub.subject] >= sub.excellent,
        ).length;

        const poorCount = analysis.filter(
            (sub) => student.scores[sub.subject] <= sub.poor,
        ).length;

        let level: Student['level'];

        if (excellentCount >= analysis.length * 0.6) {
            level = 'excellent';
        } else if (poorCount >= analysis.length * 0.6) {
            level = 'poor';
        } else if (excellentCount > poorCount) {
            level = 'good';
        } else {
            level = 'average';
        }

        return { ...student, level };
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

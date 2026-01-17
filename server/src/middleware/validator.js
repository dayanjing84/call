/**
 * 输入验证中间件
 */

import { ValidationError } from './errorHandler.js';

// 验证人员信息
export function validateEmployee(req, res, next) {
    const { name, employee_id, department } = req.body;

    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('姓名至少需要2个字符');
    }

    if (!employee_id || !/^[A-Za-z0-9]+$/.test(employee_id)) {
        errors.push('工号格式不正确');
    }

    if (!department || department.trim().length === 0) {
        errors.push('部门不能为空');
    }

    if (req.body.phone && !/^1[3-9]\d{9}$/.test(req.body.phone)) {
        errors.push('手机号格式不正确');
    }

    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        errors.push('邮箱格式不正确');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '));
    }

    next();
}

// 验证会议信息
export function validateMeeting(req, res, next) {
    const { title, date } = req.body;

    const errors = [];

    if (!title || title.trim().length < 2) {
        errors.push('会议标题至少需要2个字符');
    }

    if (!date) {
        errors.push('会议日期不能为空');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '));
    }

    next();
}

// 验证考试信息
export function validateExam(req, res, next) {
    const { title, exam_date } = req.body;

    const errors = [];

    if (!title || title.trim().length < 2) {
        errors.push('考试标题至少需要2个字符');
    }

    if (!exam_date) {
        errors.push('考试日期不能为空');
    }

    if (req.body.total_score && (req.body.total_score <= 0 || req.body.total_score > 1000)) {
        errors.push('总分必须在0-1000之间');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '));
    }

    next();
}

// 验证成绩
export function validateScore(req, res, next) {
    const { employee_id, score } = req.body;

    const errors = [];

    if (!employee_id) {
        errors.push('人员ID不能为空');
    }

    if (score === undefined || score === null) {
        errors.push('成绩不能为空');
    }

    if (score < 0 || score > 1000) {
        errors.push('成绩必须在0-1000之间');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '));
    }

    next();
}

// 通用ID验证
export function validateId(req, res, next) {
    const id = req.params.id;

    if (!id || !/^\d+$/.test(id)) {
        throw new ValidationError('无效的ID');
    }

    next();
}

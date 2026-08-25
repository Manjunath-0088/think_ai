import axiosInstance from "../api/axios";

const BASE_URL = "/assessments";

export const getAllAssessments = (moduleId) =>
  axiosInstance.get(BASE_URL, { params: moduleId ? { moduleId } : {} });

export const deleteAssessment = (id) =>
  axiosInstance.delete(`${BASE_URL}/${id}`);

export const createAssessment = (payload) =>
  axiosInstance.post(BASE_URL, payload);

export const updateAssessment = (id, payload) =>
  axiosInstance.put(`${BASE_URL}/${id}`, payload);

export const getAssessmentById = (id) =>
  axiosInstance.get(`${BASE_URL}/${id}`);

export const submitAssessment = (id, payload) =>
  axiosInstance.post(`${BASE_URL}/${id}/submit`, payload);

export const getAssessmentAnalytics = (id) =>
  axiosInstance.get(`${BASE_URL}/${id}/analytics`);

export const getEnrollmentAssessmentStatus = (enrollmentId) =>
  axiosInstance.get(`${BASE_URL}/enrollment/${enrollmentId}/status`);
import api from "./axios";

export const getModules = () =>
  api.get("/modules");

export const getModuleById = (id) =>
  api.get(`/modules/${id}`);

export const getModulesByCourseId = (courseId) =>
  api.get(`/modules/course/${courseId}`);

export const createModule = (data) =>
  api.post("/modules", data);

export const updateModule = (id, data) =>
  api.put(`/modules/${id}`, data);

export const deleteModule = (id) =>
  api.delete(`/modules/${id}`);
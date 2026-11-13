import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  /* ---------- Students ---------- */
  listStudents: () => ipcRenderer.invoke('students:list'),
  addStudent: (s) => ipcRenderer.invoke('students:add', s),
  updateStudent: (s) => ipcRenderer.invoke('students:update', s),
  deleteStudent: (id) => ipcRenderer.invoke('students:delete', id),
  promoteStudents: (items) => ipcRenderer.invoke('students:promote', items),
  exportStudents: (payload) => ipcRenderer.invoke('students:export', payload),
  previewStudents: (payload) => ipcRenderer.invoke('students:preview', payload),
  importPdfStudents: () => ipcRenderer.invoke('students:importPdf'),

  /* ---------- Attendance ---------- */
  listAttendance: (range) => ipcRenderer.invoke('attendance:list', range),
  setAttendance: (payload) => ipcRenderer.invoke('attendance:set', payload),
  setAttendanceMany: (payload) => ipcRenderer.invoke('attendance:setMany', payload),

  /* ---------- Teachers ---------- */
  listTeachers: () => ipcRenderer.invoke('teachers:list'),
  addTeacher: (t) => ipcRenderer.invoke('teachers:add', t),
  updateTeacher: (t) => ipcRenderer.invoke('teachers:update', t),
  deleteTeacher: (id) => ipcRenderer.invoke('teachers:delete', id),
  previewTeachers: (payload) => ipcRenderer.invoke('teachers:preview', payload),
  exportTeachers: (payload) => ipcRenderer.invoke('teachers:export', payload),

  /* ---------- Teacher Attendance ---------- */
  listTeacherAttendance: (range) => ipcRenderer.invoke('teacher-attendance:list', range),
  setTeacherAttendance: (payload) => ipcRenderer.invoke('teacher-attendance:set', payload),
  setTeacherAttendanceMany: (payload) => ipcRenderer.invoke('teacher-attendance:setMany', payload),

  /* ---------- Fees ---------- */
  listFeePayments: (p) => ipcRenderer.invoke('fees:list', p),
  addFeePayment: (p) => ipcRenderer.invoke('fees:add', p),
  deleteFeePayment: (id) => ipcRenderer.invoke('fees:delete', id),

  /* ---------- Exams ---------- */
  ensureExam: (p) => ipcRenderer.invoke('exams:ensure', p),
  loadExam: (p) => ipcRenderer.invoke('exams:load', p),
  addExamSubject: (p) => ipcRenderer.invoke('exams:addSubject', p),
  removeExamSubject: (p) => ipcRenderer.invoke('exams:removeSubject', p),
  updateExamSubject: (p) => ipcRenderer.invoke('exams:updateSubject', p),
  setExamMark: (p) => ipcRenderer.invoke('exams:setMark', p),
  setExamMarksBulk: (p) => ipcRenderer.invoke('exams:setMarksBulk', p),
  deleteExam: (p) => ipcRenderer.invoke('exams:delete', p),

  /* ---------- Settings ---------- */
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  saveSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  setAppPassword: (p) => ipcRenderer.invoke('settings:setPassword', p),
  removeAppPassword: () => ipcRenderer.invoke('settings:removePassword'),
  getAppPasswordHash: () => ipcRenderer.invoke('settings:getPasswordHash'),
  setRecoveryHash: (p) => ipcRenderer.invoke('settings:setRecovery', p),
  getRecoveryHash: () => ipcRenderer.invoke('settings:getRecoveryHash'),
  clearRecoveryHash: () => ipcRenderer.invoke('settings:clearRecovery'),

  /* ---------- Class Timetable ---------- */
  listClassTT: (p) => ipcRenderer.invoke('classTT:list', p),
  addClassTT: (p) => ipcRenderer.invoke('classTT:add', p),
  updateClassTT: (p) => ipcRenderer.invoke('classTT:update', p),
  deleteClassTT: (p) => ipcRenderer.invoke('classTT:delete', p),

  /* ---------- Exam Timetable ---------- */
  listExamTT: (p) => ipcRenderer.invoke('examTT:list', p),
  addExamTT: (p) => ipcRenderer.invoke('examTT:add', p),
  updateExamTT: (p) => ipcRenderer.invoke('examTT:update', p),
  deleteExamTT: (p) => ipcRenderer.invoke('examTT:delete', p),

  /* ---------- Question Bank ---------- */
  listQuestions: (p) => ipcRenderer.invoke('questions:list', p),
  addQuestion: (p) => ipcRenderer.invoke('questions:add', p),
  updateQuestion: (p) => ipcRenderer.invoke('questions:update', p),
  deleteQuestion: (p) => ipcRenderer.invoke('questions:delete', p),

  /* ---------- Papers ---------- */
  listPapers: (p) => ipcRenderer.invoke('papers:list', p),
  getPaper: (p) => ipcRenderer.invoke('papers:get', p),
  addPaper: (p) => ipcRenderer.invoke('papers:add', p),
  updatePaper: (p) => ipcRenderer.invoke('papers:update', p),
  deletePaper: (p) => ipcRenderer.invoke('papers:delete', p),
  duplicatePaper: (p) => ipcRenderer.invoke('papers:duplicate', p),
  autoGeneratePaper: (p) => ipcRenderer.invoke('papers:autoGenerate', p),

  /* ---------- Paper Sections ---------- */
  addSection: (p) => ipcRenderer.invoke('sections:add', p),
  updateSection: (p) => ipcRenderer.invoke('sections:update', p),
  deleteSection: (p) => ipcRenderer.invoke('sections:delete', p),

  /* ---------- Paper Questions ---------- */
  addPaperQuestion: (p) => ipcRenderer.invoke('paperQ:add', p),
  updatePaperQuestion: (p) => ipcRenderer.invoke('paperQ:update', p),
  deletePaperQuestion: (p) => ipcRenderer.invoke('paperQ:delete', p),

  /* ---------- Certificates ---------- */
  listCertificates: () => ipcRenderer.invoke('certificates:list'),
  getCertificate: (id) => ipcRenderer.invoke('certificates:get', id),
  addCertificate: (c) => ipcRenderer.invoke('certificates:add', c),
  updateCertificate: (c) => ipcRenderer.invoke('certificates:update', c),
  deleteCertificate: (id) => ipcRenderer.invoke('certificates:delete', id),

  /* ---------- Backup & Restore ---------- */
  createBackup: () => ipcRenderer.invoke('backup:create'),
  restoreBackup: () => ipcRenderer.invoke('backup:restore'),

  /* ---------- 🔴 LICENSE (Offline Machine-ID) ---------- */
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  activateLicense: (payload) => ipcRenderer.invoke('activate-license', payload)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
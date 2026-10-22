export type Role = 'technician' | 'supervisor' | 'admin'

export interface User {
  _id: string
  name: string
  email: string
  role: Role
  specialty?: string
  phone?: string
  active?: boolean
  permissions?: { approveQC: boolean; viewFinancials: boolean; manageTechnicians: boolean }
  can: { approveQC: boolean; viewFinancials: boolean; manageTechnicians: boolean; manageSettings: boolean; viewAllJobs: boolean }
}

export type JobStatus =
  | 'assigned' | 'accepted' | 'in_progress' | 'paused' | 'awaiting_parts'
  | 'ready_for_qc' | 'rework' | 'qc_passed' | 'ready_for_delivery'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export interface Ref { _id: string; name: string; role?: Role }

export interface CheckItem { key: string; label: string; done: boolean; note?: string }

export interface Photo {
  _id: string
  kind: 'before' | 'damage' | 'progress' | 'after' | 'inspection' | 'qc'
  url: string
  caption?: string
  annotations: { x: number; y: number; text: string }[]
  uploadedBy?: Ref
  at: string
}

export interface Marker { view: 'front' | 'rear' | 'left' | 'right' | 'top'; x: number; y: number; severity: 'minor' | 'moderate' | 'severe'; note?: string; existing?: boolean }

export interface JobCard {
  _id: string
  orderNo: string
  status: JobStatus
  priority: Priority
  deadline?: string
  progress: number
  technician?: Ref
  vehicle: { make?: string; model?: string; year?: number; vin?: string; plate?: string; color?: string; mileage?: number }
  customer?: { name?: string; phone?: string; email?: string }
  qc?: { round: number; lastResult: 'none' | 'passed' | 'failed'; submittedAt?: string }
}

export interface Task {
  _id: string
  title: string
  instructions?: string
  repairType?: string
  priority: Priority
  status: 'todo' | 'in_progress' | 'paused' | 'blocked' | 'review' | 'completed' | 'rework'
  completionPct: number
  estimatedMinutes: number
  actualMins: number
  runningSince?: string
  dueAt?: string
  assignee?: Ref
  job?: { _id: string; orderNo: string; vehicle: JobCard['vehicle']; status: JobStatus } | string
  dependencies: { _id: string; title: string; status: string }[]
  blocked?: { reason: string }
  reassignRequest?: { reason: string; status: 'pending' | 'approved' | 'rejected' }
  review?: { approved: boolean; note: string }
}

export interface PartRequest {
  _id: string
  name: string
  qty: number
  kind: 'inventory' | 'new' | 'damaged' | 'missing'
  status: 'requested' | 'approved' | 'ordered' | 'issued' | 'rejected'
  note?: string
  job: { _id: string; orderNo: string } | string
  requestedBy?: Ref
  createdAt: string
}

export interface Part { _id: string; sku: string; name: string; category: string; stock: number; reserved: number; available: number; location: string }

export interface JobDetail extends JobCard {
  damageDescription: string
  instructions: string
  supervisor?: Ref
  estimate: { amount: number; customerApproved: boolean; supplements: { _id: string; amount: number; reason: string; status: 'requested' | 'approved' | 'rejected' }[] }
  insurance: { provider: string; claimNo: string; status: 'none' | 'pending' | 'approved' | 'rejected' }
  repairTypes: string[]
  pauses: { start: string; end?: string; reason: string }[]
  history: { type: string; text: string; at: string; by?: { name: string } }[]
  internalNotes: { _id: string; text: string; at: string; by?: Ref }[]
  comments: { _id: string; text: string; at: string; by?: Ref }[]
  delays: { reason: string; at: string }[]
  additionalDamage: { description: string; severity: string; at: string }[]
  inspectionRequests: { _id: string; note: string; resolved: boolean; at: string }[]
  inspection: { completed: boolean; completedAt?: string; notes: string; checklist: CheckItem[]; damageMarkers: Marker[]; equipmentIssues: { description: string; at: string }[] }
  workflows: { type: string; steps: CheckItem[] }[]
  finalChecklist: CheckItem[]
  photos: Photo[]
  partsUsed: { _id: string; name: string; qty: number; at: string }[]
  requiredParts: { name: string; qty: number }[]
  qc: { round: number; selfChecklist: CheckItem[]; lastResult: 'none' | 'passed' | 'failed'; feedback: string; submittedAt?: string; signedOffAt?: string }
  completedAt?: string
  acceptedAt?: string
  tasks: Task[]
  partRequests: PartRequest[]
  vehicleHistory: { _id: string; orderNo: string; status: string; damageDescription: string; createdAt: string }[]
}

export interface Notice { _id: string; type: string; title: string; body: string; link: string; read: boolean; createdAt: string }

export interface Dashboard {
  scope: 'team' | 'mine'
  counters: { today: number; pending: number; inProgress: number; completed: number; overdue: number; priority: number }
  todayJobs: JobCard[]
  overdue: JobCard[]
  upcoming: JobCard[]
  priorityJobs: JobCard[]
  workload: { openTasks: number; blockedTasks: number; plannedMinutes: number; shiftMinutes: number; loadPct: number; tasksDueToday: number }
  hours: { clockedIn: boolean; onBreak: boolean; clockIn?: string; todayMinutes: number; breakMinutes: number; weekMinutes: number; shiftMinutes: number }
  runningTask: { _id: string; title: string; job: { _id: string; orderNo: string }; since: string } | null
  notifications: Notice[]
  unread: number
}

export interface Attendance { _id: string; date: string; clockIn?: string; clockOut?: string; workedMinutes: number; breakMinutes: number; onBreak: boolean; overtimeMinutes: number }
